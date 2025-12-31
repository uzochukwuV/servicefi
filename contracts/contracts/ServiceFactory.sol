// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import "./ServiceCreditToken.sol";
// import "./LiquidityPool.sol";
// import "./RedemptionOracle.sol";

// /**
//  * @title ServiceFactory
//  * @notice Factory for deploying ServiceFi ecosystem contracts
//  * @dev Gas-optimized deployment and management
//  */
// contract ServiceFactory {

//     // Deployment record (6 fields)
//     struct Deployment {
//         address serviceCreditToken;
//         address liquidityPool;
//         address redemptionOracle;
//         address deployer;
//         uint64 timestamp;
//         bool active;
//     }

//     mapping(address => Deployment) public deployments;
//     address[] public allDeployments;

//     address public immutable feeCollector;
//     uint256 public deploymentFee = 0.01 ether;

//     event EcosystemDeployed(
//         address indexed deployer,
//         address serviceCreditToken,
//         address liquidityPool,
//         address redemptionOracle
//     );

//     constructor(address _feeCollector) {
//         feeCollector = _feeCollector;
//     }

//     /**
//      * @notice Deploy complete ServiceFi ecosystem
//      * @param uri Metadata URI for service tokens
//      * @param discountBps Liquidity pool discount in basis points
//      * @param minLockPeriod Minimum LP lock period
//      */
//     function deployEcosystem(
//         string memory uri,
//         uint32 discountBps,
//         uint32 minLockPeriod
//     ) external payable returns (
//         address serviceCreditToken,
//         address liquidityPool,
//         address redemptionOracle
//     ) {
//         require(msg.value >= deploymentFee, "Insufficient fee");

//         // Deploy RedemptionOracle first
//         RedemptionOracle oracle = new RedemptionOracle(address(0)); // temp address
//         redemptionOracle = address(oracle);

//         // Deploy ServiceCreditToken
//         ServiceCreditToken sct = new ServiceCreditToken(
//             uri,
//             feeCollector,
//             redemptionOracle
//         );
//         serviceCreditToken = address(sct);

//         // Update oracle with correct SCT address
//         oracle = new RedemptionOracle(serviceCreditToken);
//         redemptionOracle = address(oracle);

//         // Update SCT with correct oracle
//         sct.updateOracle(redemptionOracle);

//         // Deploy LiquidityPool
//         LiquidityPool pool = new LiquidityPool(
//             serviceCreditToken,
//             discountBps,
//             minLockPeriod
//         );
//         liquidityPool = address(pool);

//         // Record deployment
//         Deployment memory deployment = Deployment({
//             serviceCreditToken: serviceCreditToken,
//             liquidityPool: liquidityPool,
//             redemptionOracle: redemptionOracle,
//             deployer: msg.sender,
//             timestamp: uint64(block.timestamp),
//             active: true
//         });

//         deployments[msg.sender] = deployment;
//         allDeployments.push(msg.sender);

//         // Transfer deployment fee
//         payable(feeCollector).transfer(deploymentFee);

//         // Refund excess
//         if (msg.value > deploymentFee) {
//             payable(msg.sender).transfer(msg.value - deploymentFee);
//         }

//         emit EcosystemDeployed(
//             msg.sender,
//             serviceCreditToken,
//             liquidityPool,
//             redemptionOracle
//         );

//         return (serviceCreditToken, liquidityPool, redemptionOracle);
//     }

//     /**
//      * @notice Get deployment info for address
//      */
//     function getDeployment(address deployer) external view returns (
//         address serviceCreditToken,
//         address liquidityPool,
//         address redemptionOracle,
//         uint64 timestamp
//     ) {
//         Deployment memory d = deployments[deployer];
//         return (
//             d.serviceCreditToken,
//             d.liquidityPool,
//             d.redemptionOracle,
//             d.timestamp
//         );
//     }

//     /**
//      * @notice Get total deployments count
//      */
//     function getDeploymentsCount() external view returns (uint256) {
//         return allDeployments.length;
//     }
// }
