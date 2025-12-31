// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/ServiceCreditToken.sol";
import "../contracts/LiquidityPool.sol";
import "../contracts/RedemptionOracle.sol";
import "../contracts/ServiceFactory.sol";

/**
 * @title DeployDirect
 * @notice Simple deployment script without using forge-std
 */
contract DeployDirect {
    function run() external {
        // This will be called by forge script
        // Deploy ServiceCreditToken
        string memory uri = "https://api.servicefi.io/metadata/{id}.json";
        ServiceCreditToken serviceCreditToken = new ServiceCreditToken(uri);

        // Deploy LiquidityPool
        uint256 discount = 1000; // 10%
        uint256 minLockPeriod = 7 days;
        LiquidityPool liquidityPool = new LiquidityPool(
            address(serviceCreditToken),
            discount,
            minLockPeriod
        );

        // Deploy RedemptionOracle
        RedemptionOracle redemptionOracle = new RedemptionOracle(address(serviceCreditToken));

        // Deploy ServiceFactory
        ServiceFactory factory = new ServiceFactory(msg.sender);

        // Setup oracle
        serviceCreditToken.setOracle(address(redemptionOracle));
    }
}
