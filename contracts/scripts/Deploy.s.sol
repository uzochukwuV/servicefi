// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/ServiceCreditToken.sol";
import "../contracts/LiquidityPool.sol";
import "../contracts/RedemptionOracle.sol";
import "../contracts/ServiceFactory.sol";

/**
 * @title Deploy
 * @notice Deployment script for ServiceFi ecosystem on Mantle
 */
contract Deploy is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying ServiceFi ecosystem...");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ServiceFactory
        address feeCollector = deployer; // Can be changed later
        ServiceFactory factory = new ServiceFactory(feeCollector);
        console.log("ServiceFactory deployed at:", address(factory));

        // 2. Deploy complete ecosystem via factory
        (
            address serviceCreditToken,
            address liquidityPool,
            address redemptionOracle
        ) = factory.deployEcosystem{value: 0.01 ether}(
            "https://api.servicefi.io/metadata/{id}.json",
            1000,    // 10% discount for liquidity providers
            7 days   // Minimum 7-day lock period
        );

        console.log("=== ServiceFi Deployment Complete ===");
        console.log("ServiceCreditToken:", serviceCreditToken);
        console.log("LiquidityPool:", liquidityPool);
        console.log("RedemptionOracle:", redemptionOracle);
        console.log("=====================================");

        vm.stopBroadcast();

        // Save deployment addresses
        string memory deploymentInfo = string(abi.encodePacked(
            "FACTORY=", vm.toString(address(factory)), "\n",
            "SERVICE_CREDIT_TOKEN=", vm.toString(serviceCreditToken), "\n",
            "LIQUIDITY_POOL=", vm.toString(liquidityPool), "\n",
            "REDEMPTION_ORACLE=", vm.toString(redemptionOracle), "\n"
        ));

        vm.writeFile("./deployments/mantle.env", deploymentInfo);
        console.log("Deployment info saved to ./deployments/mantle.env");
    }
}
