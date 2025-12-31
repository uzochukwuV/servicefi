import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting ServiceFi deployment to Mantle Sepolia Testnet...\n");

  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", networkName);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MNT\n");

  if (balance === 0n) {
    console.error("❌ Account has no MNT! Please fund your account from the faucet:");
    console.error("   https://faucet.mantle.xyz\n");
    process.exit(1);
  }

  // Step 1: Deploy RedemptionOracle (no dependencies)
  console.log("📝 Step 1: Deploying RedemptionOracle...");
  const redemptionOracle = await ethers.deployContract("RedemptionOracle", []);
  await redemptionOracle.waitForDeployment();
  const redemptionOracleAddress = await redemptionOracle.getAddress();
  console.log("✅ RedemptionOracle deployed to:", redemptionOracleAddress);

  // Step 2: Deploy ServiceCreditToken (needs feeCollector and oracle addresses)
  console.log("\n📝 Step 2: Deploying ServiceCreditToken...");
  const uri = "https://api.servicefi.io/metadata/{id}.json";
  const feeCollector = deployer.address;
  const serviceCreditToken = await ethers.deployContract("ServiceCreditToken", [
    uri,
    feeCollector,
    redemptionOracleAddress
  ]);
  await serviceCreditToken.waitForDeployment();
  const serviceCreditTokenAddress = await serviceCreditToken.getAddress();
  console.log("✅ ServiceCreditToken deployed to:", serviceCreditTokenAddress);

  // Step 3: Link ServiceCreditToken back to RedemptionOracle
  console.log("\n⚙️  Step 3: Linking contracts...");
  const linkTx = await redemptionOracle.setServiceCreditToken(serviceCreditTokenAddress);
  await linkTx.wait();
  console.log("✅ ServiceCreditToken linked to RedemptionOracle");

  // Step 4: Deploy LiquidityPool (needs serviceCreditToken address)
  console.log("\n📝 Step 4: Deploying LiquidityPool...");
  const discount = 1000; // 10% discount (basis points)
  const minLockPeriod = 7 * 24 * 60 * 60; // 7 days
  const liquidityPool = await ethers.deployContract("LiquidityPool", [
    serviceCreditTokenAddress,
    discount,
    minLockPeriod
  ]);
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);

  // Step 5: Deploy ServiceTokenMarketplace
  console.log("\n📝 Step 5: Deploying ServiceTokenMarketplace...");
  const marketplace = await ethers.deployContract("ServiceTokenMarketplace", [
    serviceCreditTokenAddress,
    deployer.address // feeCollector
  ]);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ ServiceTokenMarketplace deployed to:", marketplaceAddress);

  // Save deployment info
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deploymentInfo = {
    network: networkName,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      serviceCreditToken: serviceCreditTokenAddress,
      liquidityPool: liquidityPoolAddress,
      redemptionOracle: redemptionOracleAddress,
      marketplace: marketplaceAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const envContent = `SERVICE_CREDIT_TOKEN=${serviceCreditTokenAddress}\nLIQUIDITY_POOL=${liquidityPoolAddress}\nREDEMPTION_ORACLE=${redemptionOracleAddress}\nMARKETPLACE=${marketplaceAddress}\n`;
  fs.writeFileSync(path.join(deploymentsDir, "mantle-sepolia.env"), envContent);

  const jsonContent = JSON.stringify(deploymentInfo, null, 2);
  fs.writeFileSync(path.join(deploymentsDir, "mantle-sepolia.json"), jsonContent);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 ServiceFi Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   ServiceCreditToken:", serviceCreditTokenAddress);
  console.log("   LiquidityPool:     ", liquidityPoolAddress);
  console.log("   RedemptionOracle:  ", redemptionOracleAddress);
  console.log("   Marketplace:       ", marketplaceAddress);
  console.log("\n💾 Deployment info saved to:");
  console.log("   ./deployments/mantle-sepolia.env");
  console.log("   ./deployments/mantle-sepolia.json");
  console.log("\n🔍 Next steps:");
  console.log("   1. Verify contracts on explorer");
  console.log("   2. Update frontend/lib/contracts/addresses.ts");
  console.log("   3. Test contract interactions");
  console.log("\n📍 Explorer:");
  console.log("   https://explorer.sepolia.mantle.xyz");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
