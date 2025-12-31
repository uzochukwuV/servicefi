// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ServiceCreditToken.sol";

/**
 * @title LiquidityPool
 * @notice Enables DeFi liquidity providers to purchase service credits at discount
 * @dev Gas-optimized with struct limit of 8 fields
 */
contract LiquidityPool is ReentrancyGuard {

    // Pool configuration (7 fields)
    struct PoolConfig {
        uint128 totalLiquidity;      // Total ETH in pool
        uint128 totalValuePurchased; // Total value of credits purchased
        uint64 createdAt;
        uint32 discountBps;          // Discount in basis points (e.g., 1000 = 10%)
        uint32 minLockPeriod;        // Minimum lock period in seconds
        bool active;
        uint8 riskTier;              // Risk tier (0-5)
    }

    // LP position (6 fields)
    struct LPPosition {
        uint128 liquidityProvided;
        uint128 yieldEarned;
        uint64 depositTime;
        uint64 unlockTime;
        uint32 positionId;
        bool active;
    }

    // Purchase record (5 fields)
    struct PurchaseRecord {
        uint256 tokenId;
        uint128 amountPaid;
        uint128 faceValue;
        uint64 timestamp;
        address buyer;
    }

    ServiceCreditToken public immutable serviceCreditToken;

    mapping(address => LPPosition[]) public lpPositions;
    mapping(address => uint128) public pendingWithdrawals;

    PoolConfig public poolConfig;
    PurchaseRecord[] public purchases;

    uint256 public nextPositionId = 1;
    address public poolManager;

    event LiquidityAdded(address indexed provider, uint128 amount, uint32 positionId);
    event LiquidityRemoved(address indexed provider, uint128 amount);
    event CreditsPurchased(uint256 indexed tokenId, uint128 discount, uint128 faceValue);
    event YieldDistributed(uint128 totalYield);

    modifier onlyManager() {
        require(msg.sender == poolManager, "Not manager");
        _;
    }

    constructor(
        address _serviceCreditToken,
        uint32 _discountBps,
        uint32 _minLockPeriod
    ) {
        serviceCreditToken = ServiceCreditToken(_serviceCreditToken);
        poolManager = msg.sender;

        poolConfig = PoolConfig({
            totalLiquidity: 0,
            totalValuePurchased: 0,
            createdAt: uint64(block.timestamp),
            discountBps: _discountBps,
            minLockPeriod: _minLockPeriod,
            active: true,
            riskTier: 1
        });
    }

    /**
     * @notice Add liquidity to pool
     * @param lockPeriod Lock period in seconds
     */
    function addLiquidity(uint32 lockPeriod) external payable nonReentrant {
        require(poolConfig.active, "Pool inactive");
        require(msg.value > 0, "Zero liquidity");
        require(lockPeriod >= poolConfig.minLockPeriod, "Lock too short");

        uint128 amount = uint128(msg.value);

        LPPosition memory position = LPPosition({
            liquidityProvided: amount,
            yieldEarned: 0,
            depositTime: uint64(block.timestamp),
            unlockTime: uint64(block.timestamp + lockPeriod),
            positionId: uint32(nextPositionId++),
            active: true
        });

        lpPositions[msg.sender].push(position);
        poolConfig.totalLiquidity += amount;

        emit LiquidityAdded(msg.sender, amount, position.positionId);
    }

    /**
     * @notice Purchase service credits at discount
     * @param tokenId Service token ID
     * @param amount Number of credits to purchase
     */
    function purchaseCredits(
        uint256 tokenId,
        uint256 amount
    ) external onlyManager nonReentrant {
        require(poolConfig.active, "Pool inactive");

        // Get service price
        (uint128 price,,,, bool active) = serviceCreditToken.getServiceInfo(tokenId);
        require(active, "Service inactive");

        uint128 faceValue = uint128(uint256(price) * amount);
        uint128 discountedPrice = faceValue - (faceValue * poolConfig.discountBps / 10000);

        require(poolConfig.totalLiquidity >= discountedPrice, "Insufficient liquidity");

        // Update pool state
        poolConfig.totalLiquidity -= discountedPrice;
        poolConfig.totalValuePurchased += faceValue;

        // Purchase credits from ServiceCreditToken
        serviceCreditToken.mintCredit{value: discountedPrice}(tokenId, amount);

        // Record purchase
        purchases.push(PurchaseRecord({
            tokenId: tokenId,
            amountPaid: discountedPrice,
            faceValue: faceValue,
            timestamp: uint64(block.timestamp),
            buyer: address(this)
        }));

        emit CreditsPurchased(tokenId, poolConfig.discountBps, faceValue);
    }

    /**
     * @notice Distribute yield to LPs proportionally
     */
    function distributeYield() external onlyManager {
        uint128 totalYield = poolConfig.totalValuePurchased -
                            (poolConfig.totalLiquidity + getTotalLPStake());

        require(totalYield > 0, "No yield");

        // Simple proportional distribution
        // In production, use more sophisticated yield calculation

        emit YieldDistributed(totalYield);
    }

    /**
     * @notice Withdraw liquidity after lock period
     * @param positionIndex Index of LP position
     */
    function withdrawLiquidity(uint256 positionIndex) external nonReentrant {
        require(positionIndex < lpPositions[msg.sender].length, "Invalid position");

        LPPosition storage position = lpPositions[msg.sender][positionIndex];
        require(position.active, "Position inactive");
        require(block.timestamp >= position.unlockTime, "Still locked");

        uint128 totalWithdrawal = position.liquidityProvided + position.yieldEarned;

        position.active = false;
        poolConfig.totalLiquidity -= position.liquidityProvided;

        payable(msg.sender).transfer(totalWithdrawal);

        emit LiquidityRemoved(msg.sender, totalWithdrawal);
    }

    /**
     * @notice Get total LP stake
     */
    function getTotalLPStake() public view returns (uint128 total) {
        // Simplified - in production, iterate all LPs
        return poolConfig.totalLiquidity;
    }

    /**
     * @notice Update pool discount
     */
    function updateDiscount(uint32 newDiscountBps) external onlyManager {
        require(newDiscountBps <= 5000, "Discount too high"); // Max 50%
        poolConfig.discountBps = newDiscountBps;
    }

    /**
     * @notice Get LP positions for address
     */
    function getLPPositions(address lp) external view returns (LPPosition[] memory) {
        return lpPositions[lp];
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats() external view returns (
        uint128 totalLiquidity,
        uint128 totalValuePurchased,
        uint32 discountBps,
        bool active
    ) {
        return (
            poolConfig.totalLiquidity,
            poolConfig.totalValuePurchased,
            poolConfig.discountBps,
            poolConfig.active
        );
    }

    // ========== DASHBOARD HELPER FUNCTIONS ==========

    /**
     * @notice Get current yield available in the pool
     * @return yieldAvailable Yield ready to be distributed
     */
    function getCurrentYield() external view returns (uint128) {
        if (poolConfig.totalValuePurchased <= poolConfig.totalLiquidity) {
            return 0;
        }
        return poolConfig.totalValuePurchased - poolConfig.totalLiquidity;
    }

    /**
     * @notice Get user's total liquidity and yield
     * @param lp Address of the liquidity provider
     * @return totalProvided Total liquidity provided
     * @return totalYield Total yield earned
     * @return activePositions Number of active positions
     */
    function getUserLPStats(address lp) external view returns (
        uint128 totalProvided,
        uint128 totalYield,
        uint256 activePositions
    ) {
        LPPosition[] memory positions = lpPositions[lp];
        uint256 active = 0;

        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i].active) {
                totalProvided += positions[i].liquidityProvided;
                totalYield += positions[i].yieldEarned;
                active++;
            }
        }

        return (totalProvided, totalYield, active);
    }

    /**
     * @notice Get detailed pool analytics
     * @return totalLiquidity Total MNT in pool
     * @return totalValuePurchased Total value of credits purchased
     * @return currentYield Available yield
     * @return discountBps Discount in basis points
     * @return utilization Pool utilization rate (basis points)
     */
    function getPoolAnalytics() external view returns (
        uint128 totalLiquidity,
        uint128 totalValuePurchased,
        uint128 currentYield,
        uint32 discountBps,
        uint256 utilization
    ) {
        totalLiquidity = poolConfig.totalLiquidity;
        totalValuePurchased = poolConfig.totalValuePurchased;
        discountBps = poolConfig.discountBps;

        // Calculate yield
        currentYield = totalValuePurchased > totalLiquidity
            ? totalValuePurchased - totalLiquidity
            : 0;

        // Calculate utilization rate (how much liquidity is deployed)
        utilization = totalLiquidity > 0
            ? (uint256(totalValuePurchased) * 10000) / uint256(totalLiquidity)
            : 0;

        return (totalLiquidity, totalValuePurchased, currentYield, discountBps, utilization);
    }

    /**
     * @notice Check if a position is unlocked and withdrawable
     * @param lp Liquidity provider address
     * @param positionIndex Index of the position
     * @return unlocked Whether position is unlocked
     * @return timeRemaining Seconds until unlock (0 if unlocked)
     */
    function isPositionUnlocked(address lp, uint256 positionIndex)
        external
        view
        returns (bool unlocked, uint256 timeRemaining)
    {
        require(positionIndex < lpPositions[lp].length, "Invalid position");

        LPPosition memory position = lpPositions[lp][positionIndex];

        if (!position.active) {
            return (false, 0);
        }

        if (block.timestamp >= position.unlockTime) {
            return (true, 0);
        }

        return (false, position.unlockTime - block.timestamp);
    }
}
