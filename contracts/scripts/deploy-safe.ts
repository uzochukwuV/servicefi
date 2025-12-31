import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function waitForPendingTransactions(ethers: any, deployer: any) {
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes (12 * 10 seconds)

  while (attempts < maxAttempts) {
    const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

    if (pendingNonce === nonce) {
      console.log("✅ No pending transactions. Ready to deploy!\n");
      return nonce;
    }

    const stuck = pendingNonce - nonce;
    console.log(`⏳ Waiting for ${stuck} pending transaction(s) to clear... (${attempts + 1}/${maxAttempts})`);

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
  }

  throw new Error("Timeout waiting for pending transactions. Check explorer: https://explorer.sepolia.mantle.xyz/address/" + deployer.address);
}

async function main() {
  console.log("🚀 Starting SAFE ServiceFi deployment to Mantle Sepolia Testnet...\n");

  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();

  // await deployer.sendTransaction({ to: "0x8AaEe2071A400cC60927e46D53f751e521ef4D35", value: ethers.parseEther("0.1") })

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", networkName);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MNT\n");

  if (balance === 0n) {
    console.error("❌ Account has no MNT! Please fund your account from the faucet:");
    console.error("   https://faucet.mantle.xyz\n");
    process.exit(1);
  }

  // Wait for any pending transactions to clear
  console.log("Checking for pending transactions...");
  const startNonce = await waitForPendingTransactions(ethers, deployer);

  // Step 1: Deploy RedemptionOracle
  console.log("📝 Step 1: Deploying RedemptionOracle...");
  // const redemptionOracle = await ethers.deployContract("RedemptionOracle", []);
  console.log("   Transaction sent, waiting for confirmation...");
  // await redemptionOracle.waitForDeployment();
  const redemptionOracleAddress = "0xA3cfF6bC5Fd24061A80A727a8075f990C2b677C6"
  console.log("✅ RedemptionOracle deployed to:", redemptionOracleAddress);

  // Step 2: Deploy ServiceCreditToken
  console.log("\n📝 Step 2: Deploying ServiceCreditToken...");
  const uri = "https://api.servicefi.io/metadata/{id}.json";
  const feeCollector = deployer.address;
  // const serviceCreditToken = await ethers.deployContract("ServiceCreditToken", [
  //   uri,
  //   feeCollector,
  //   redemptionOracleAddress
  // ]);
  console.log("   Transaction sent, waiting for confirmation...");
  // await serviceCreditToken.waitForDeployment();
  const serviceCreditTokenAddress = "0x559B5D73861221114c6aA5F08fCA14445B802d7F"
  console.log("✅ ServiceCreditToken deployed to:", serviceCreditTokenAddress);

  // Step 3: Link contracts
  console.log("\n⚙️  Step 3: Linking contracts...");
  (await ethers.getContractAt("RedemptionOracle", redemptionOracleAddress)).setServiceCreditToken(serviceCreditTokenAddress)
  // const linkTx = await redemptionOracle.setServiceCreditToken(serviceCreditTokenAddress);
  console.log("   Transaction sent, waiting for confirmation...");
  // await linkTx.wait();
  console.log("✅ ServiceCreditToken linked to RedemptionOracle");

  // Step 4: Deploy LiquidityPool
  console.log("\n📝 Step 4: Deploying LiquidityPool...");
  const discount = 1000; // 10%
  const minLockPeriod = 7 * 24 * 60 * 60; // 7 days
  // const liquidityPool = await ethers.deployContract("LiquidityPool", [
  //   serviceCreditTokenAddress,
  //   discount,
  //   minLockPeriod
  // ]);
  console.log("   Transaction sent, waiting for confirmation...");
  // await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = "0x9326e8AEC03cFfb5e7D7a6f431396BeB31fdDF15"
  console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);

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
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const envContent = `SERVICE_CREDIT_TOKEN=${serviceCreditTokenAddress}\nLIQUIDITY_POOL=${liquidityPoolAddress}\nREDEMPTION_ORACLE=${redemptionOracleAddress}\n`;
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
  console.log("\n💾 Deployment info saved to:");
  console.log("   ./deployments/mantle-sepolia.env");
  console.log("   ./deployments/mantle-sepolia.json");
  console.log("\n🔍 Verify contracts on:");
  console.log("   https://explorer.sepolia.mantle.xyz");
  console.log("\n📝 Next: Update frontend/lib/contracts/addresses.ts with these addresses");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
