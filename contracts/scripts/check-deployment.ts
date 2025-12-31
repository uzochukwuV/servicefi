import { network } from "hardhat";

async function main() {
  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Checking deployment status for:", deployer.address);
  console.log("Network:", networkName);

  const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

  console.log("\nNonce Status:");
  console.log("  Latest (mined):", nonce);
  console.log("  Pending:", pendingNonce);
  console.log("  Stuck transactions:", pendingNonce - nonce);

  if (pendingNonce > nonce) {
    console.log("\n⚠️  You have", pendingNonce - nonce, "pending transaction(s)!");
    console.log("Wait 2-3 minutes for them to be mined, or check:");
    console.log("https://explorer.sepolia.mantle.xyz/address/" + deployer.address);
  } else {
    console.log("\n✅ No pending transactions. Safe to deploy!");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("\nBalance:", ethers.formatEther(balance), "MNT");
}

main().catch(console.error);
