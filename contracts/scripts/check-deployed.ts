import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Checking deployed contracts from transaction history...\n");

  // These are the transaction hashes from the explorer
  const tx1 = "0x42e337b5ddee9304c8fe38fee29242a98baba31b1999eed15a4fc8d95b57e9bd"; // 3 mins ago
  const tx2 = "0x1df1f3631f4e90eca1e6af6403e921e3ca866f555e3f682cda509b9b971d75a9"; // 18 secs ago

  try {
    const receipt1 = await ethers.provider.getTransactionReceipt(tx1);
    const receipt2 = await ethers.provider.getTransactionReceipt(tx2);

    if (receipt1 && receipt1.contractAddress) {
      console.log("Contract 1 (3 mins ago):");
      console.log("  Address:", receipt1.contractAddress);
      console.log("  Status:", receipt1.status === 1 ? "✅ Success" : "❌ Failed");

      // Try to determine which contract it is
      const code = await ethers.provider.getCode(receipt1.contractAddress);
      console.log("  Has code:", code.length > 2 ? "Yes" : "No");
    }

    if (receipt2 && receipt2.contractAddress) {
      console.log("\nContract 2 (18 secs ago):");
      console.log("  Address:", receipt2.contractAddress);
      console.log("  Status:", receipt2.status === 1 ? "✅ Success" : "❌ Failed");

      const code = await ethers.provider.getCode(receipt2.contractAddress);
      console.log("  Has code:", code.length > 2 ? "Yes" : "No");
    }

    console.log("\n" + "=".repeat(60));
    console.log("Based on deployment order, these are likely:");
    console.log("  Contract 1:", receipt1?.contractAddress, "→ RedemptionOracle");
    console.log("  Contract 2:", receipt2?.contractAddress, "→ ServiceCreditToken");
    console.log("\n⏳ Still need to deploy: LiquidityPool");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
  }
}

main().catch(console.error);
