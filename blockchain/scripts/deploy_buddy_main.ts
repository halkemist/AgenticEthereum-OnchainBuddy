import {ethers} from "hardhat";
require("@nomicfoundation/hardhat-toolbox")

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n=== Deployment Information ===");
  const network = await ethers.provider.getNetwork();
  console.log("Network Chain ID: ", network.chainId);
  console.log("Deployer:", deployer.address);

  console.log("\n=== Deploying Onchain Buddy contract ===");
  const BUDDY = await ethers.getContractFactory("BuddyMain");
  console.log("Contract bytecode loaded");

  const buddy = await BUDDY.deploy({
    gasLimit: 6000000
  });

  console.log("Deploying... please wait.");
  await buddy.deployed();

  console.log("\n=== Deployment Success ===");
  console.log("BuddyMain deployed to:", buddy.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n=== Deployment Failed ===");
    console.error(error);
    process.exit(1);
  });