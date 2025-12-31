Deploying within Hardhat scripts
Hardhat Ignition is a powerful deployment engine, but you may find there are some programming concepts that are not allowed within an Ignition module. Conditional logic, async/await, and console.log of deployment variables are some examples of operations that cannot be performed within an Ignition module. However, this guide will show you how you can perform all of these operations by pairing Ignition with Hardhat scripts.

Tip

This guide will be using the contracts and Ignition module from the quick start guide.

Logging a contract’s address to the console
We will begin by creating a scripts directory within our Hardhat project. Within this directory, create a new file called deploy.ts (or deploy.js if you’re using JavaScript) and add the following code:

import hre from "hardhat";
import ApolloModule from "../ignition/modules/Apollo.js";

async function main() {
  const connection = await hre.network.connect();
  const { apollo } = await connection.ignition.deploy(ApolloModule);

  // or `apollo.getAddress()` if you're using Ethers.js
  console.log(`Apollo deployed to: ${apollo.address}`);
}

main().catch(console.error);

This script imports the Apollo module and deploys it using connection.ignition.deploy. The apollo object in this example is a Viem contract instance, which returns the deployed contract’s address via the address property. We then log this address to the console. To run the script, execute the following command:

npm
pnpm
Yarn
Terminal window
npx hardhat run scripts/deploy.ts

Asynchronous operations
For this example, let’s say we want to dynamically change the name of the Rocket contract according to some external data. We need to make an asynchronous call to an API to retrieve this data, and we also need to adjust our Ignition module to accept this data as a parameter. First, let’s update our Ignition module:

import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Apollo", (m) => {
  const rocketName = m.getParameter("rocketName");
  const apollo = m.contract("Rocket", [rocketName]);

  m.call(apollo, "launch", []);

  return { apollo };
});

We’ve added a new parameter to the Ignition module called rocketName. This parameter will be passed to the Rocket contract when it is deployed. Next, let’s update our deployment script to make an asynchronous call to an API:

import hre from "hardhat";
import ApolloModule from "../ignition/modules/Apollo.js";

async function getRocketNameFromAPI() {
  // Mock function to simulate an asynchronous API call
  return "Saturn VI";
}

async function main() {
  const rocketName = await getRocketNameFromAPI();

  const connection = await hre.network.connect();
  const { apollo } = await connection.ignition.deploy(ApolloModule, {
    parameters: { Apollo: { rocketName } },
  });

  console.log(`Apollo deployed to: ${apollo.address}`);
}

main().catch(console.error);

In this script, we’ve added a new function called getRocketNameFromAPI, which simulates an asynchronous API call. We then call this function to retrieve the rocket name and pass it as a parameter under the named Ignition module when deploying the Apollo module. You can run this script using the same command as before.

Tip

You can read more about defining and using parameters in Ignition modules in the deployment guide.

Conditional logic
Lastly, let’s add some conditional logic to our deployment script. Suppose we want to deploy the Apollo module only if the rocket name is not empty. We can achieve this by adding a simple if statement to our script:

import ApolloModule from "../ignition/modules/Apollo.js";

async function getRocketNameFromAPI() {
  // Mock function to simulate an asynchronous API call
  return "Saturn VI";
}

async function main() {
  const rocketName = await getRocketNameFromAPI();

  if (rocketName !== undefined) {
    const { apollo } = await hre.ignition.deploy(ApolloModule, {
      parameters: { Apollo: { rocketName } },
    });

    console.log(`Apollo deployed to: ${apollo.address}`);
  } else {
    console.log("No name given for Rocket contract, skipping deployment");
  }
}

main().catch(console.error);

In this script, we’ve added an if statement to check if the rocketName is not undefined. If it is not undefined, we proceed with deploying the Apollo module; otherwise, we log a message to the console indicating that the deployment has been skipped. You can run this script using the same command as before.

By combining Hardhat Ignition with Hardhat scripts, you can perform advanced deployment operations that are not possible within an Ignition module alone. These are just a few examples of what you can achieve with this powerful combination. Feel free to experiment further and explore the possibilities!



## on hardhat 3


Deploying smart contracts using scripts
You can write scripts that use Hardhat and use them for basic smart contract deployments.

In this guide we’ll show you how to run the same deployment as the Ignition Module included in the sample projects, but using viem and ethers.js.

We assume you followed the instructions in this section first.

Writing a deployment script with viem
To build a deployment script using viem, create the scripts/deploy-counter.ts file with this content:

scripts/deploy-counter.ts
import { network } from "hardhat";

const { viem, networkName } = await network.connect();
const client = await viem.getPublicClient();

console.log(`Deploying Counter to ${networkName}...`);

const counter = await viem.deployContract("Counter");

console.log("Counter address:", counter.address);

console.log("Calling counter.incBy(5)");
const tx = await counter.write.incBy([5n]);

console.log("Waiting for the counter.incBy(5) tx to confirm");
await client.waitForTransactionReceipt({ hash: tx, confirmations: 1 });

console.log("Deployment successful!");

Writing a deployment script with ethers.js
To build a deployment script using ethers, create the scripts/deploy-counter.ts file with this content:

scripts/deploy-counter.ts
import { network } from "hardhat";

const { ethers, networkName } = await network.connect();

console.log(`Deploying Counter to ${networkName}...`);

const counter = await ethers.deployContract("Counter");

console.log("Waiting for the deployment tx to confirm");
await counter.waitForDeployment();

console.log("Counter address:", await counter.getAddress());

console.log("Calling counter.incBy(5)");
const tx = await counter.incBy(5n);

console.log("Waiting for the counter.incBy(5) tx to confirm");
await tx.wait();

console.log("Deployment successful!");

Running your deployment script
To run your deployment, use hardhat run <script>.

Make sure you use the production Build Profile so your contracts get optimized for production and compiled using Isolated Builds.

npm
pnpm
Yarn
Terminal window
npx hardhat run scripts/deploy-counter.ts --build-profile production --network sepolia

Input your keystore password and wait for the deployment to complete.

Disadvantages of deploying with scripts
Deploying with a script can be simple in basic cases like the ones shown here, but doesn’t scale well to mid-size and larger projects.

Some of the problems are:

They can’t recover from errors automatically
They can’t be resumed after being updated or fixed (everything will be redeployed!)
They don’t have a standardized format to track and version your deployment results
They are harder to integrate with TypeScript tests
