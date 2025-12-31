// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ServiceCreditToken
 * @notice ERC1155 token representing prepaid service credits
 * @dev Gas-optimized with structs limited to 8 fields max
 */
contract ServiceCreditToken is ERC1155, Ownable, ReentrancyGuard {

    // Core service metadata (6 fields - safe from stack overflow)
    struct ServiceMetadata {
        uint128 price;           // Service price in wei (packed)
        uint64 expiryTimestamp;  // Expiration timestamp (packed)
        uint32 maxSupply;        // Maximum mintable supply
        uint32 totalMinted;      // Total minted so far
        bool active;             // Whether service is active
        uint8 serviceType;       // Service category (0-255)
    }

    // Provider info (6 fields)
    struct ProviderInfo {
        address providerAddress;
        uint128 totalValueLocked; // Total value of active credits
        uint64 registrationTime;
        uint32 serviceCount;      // Number of services offered
        bool verified;
        bool active;
    }

    // Redemption tracking (5 fields)
    struct RedemptionRecord {
        uint256 tokenId;
        address redeemer;
        uint64 timestamp;
        uint128 valueRedeemed;
        bool completed;
    }

    // Events
    event ServiceCreated(uint256 indexed tokenId, address indexed provider, uint128 price, string tokenURI);
    event ServiceRedeemed(uint256 indexed tokenId, address indexed redeemer, uint128 value);
    event ProviderRegistered(address indexed provider);
    event ServiceExpired(uint256 indexed tokenId, uint256 unredeemedAmount);

    // Storage - optimized packing
    mapping(uint256 => ServiceMetadata) public services;
    mapping(address => ProviderInfo) public providers;
    mapping(uint256 => mapping(address => uint256)) public userBalances;
    mapping(uint256 => RedemptionRecord[]) public redemptions;
    mapping(uint256 => string) private _tokenURIs; // IPFS URIs for each service

    uint256 public nextTokenId = 1;
    uint256 public platformFee = 25; // 0.25% (basis points)
    address public feeCollector;
    address public redemptionOracle;

    modifier onlyProvider() {
        require(providers[msg.sender].active, "Not active provider");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == redemptionOracle, "Not oracle");
        _;
    }

    constructor(
        string memory baseURI,
        address _feeCollector,
        address _redemptionOracle
    ) ERC1155(baseURI) Ownable(msg.sender) {
        feeCollector = _feeCollector;
        redemptionOracle = _redemptionOracle;
    }

    /**
     * @notice Register as a service provider
     */
    function registerProvider() external {
        require(!providers[msg.sender].active, "Already registered");

        providers[msg.sender] = ProviderInfo({
            providerAddress: msg.sender,
            totalValueLocked: 0,
            registrationTime: uint64(block.timestamp),
            serviceCount: 0,
            verified: false,
            active: true
        });

        emit ProviderRegistered(msg.sender);
    }

    /**
     * @notice Create a new service credit type
     * @param price Service price in wei
     * @param expiryTimestamp Expiration timestamp
     * @param maxSupply Maximum supply
     * @param serviceType Service category
     * @param tokenURI IPFS URI for service metadata (e.g., "ipfs://QmXXX...")
     */
    function createService(
        uint128 price,
        uint64 expiryTimestamp,
        uint32 maxSupply,
        uint8 serviceType,
        string memory tokenURI
    ) external onlyProvider returns (uint256) {
        require(price > 0, "Invalid price");
        require(expiryTimestamp > block.timestamp, "Invalid expiry");
        require(maxSupply > 0, "Invalid supply");
        require(bytes(tokenURI).length > 0, "Empty URI");

        uint256 tokenId = nextTokenId++;

        services[tokenId] = ServiceMetadata({
            price: price,
            expiryTimestamp: expiryTimestamp,
            maxSupply: maxSupply,
            totalMinted: 0,
            active: true,
            serviceType: serviceType
        });

        _tokenURIs[tokenId] = tokenURI;
        providers[msg.sender].serviceCount++;

        emit ServiceCreated(tokenId, msg.sender, price, tokenURI);
        return tokenId;
    }

    /**
     * @notice Mint service credits (called by customer or liquidity pool)
     * @param tokenId Service token ID
     * @param amount Number of credits to mint
     */
    function mintCredit(
        uint256 tokenId,
        uint256 amount
    ) external payable nonReentrant {
        ServiceMetadata storage service = services[tokenId];

        require(service.active, "Service inactive");
        require(block.timestamp < service.expiryTimestamp, "Service expired");
        require(service.totalMinted + amount <= service.maxSupply, "Exceeds max supply");

        uint256 totalCost = uint256(service.price) * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        // Calculate and collect platform fee
        uint256 fee = (totalCost * platformFee) / 10000;

        // Update state
        service.totalMinted += uint32(amount);
        userBalances[tokenId][msg.sender] += amount;

        // Mint tokens
        _mint(msg.sender, tokenId, amount, "");

        // Transfer payments
        payable(feeCollector).transfer(fee);
        // Note: Provider receives payment when they sell credits via liquidity pool

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    /**
     * @notice Redeem service credit (called by oracle after verification)
     * @param tokenId Service token ID
     * @param redeemer Address redeeming the service
     * @param amount Amount to redeem
     */
    function redeemCredit(
        uint256 tokenId,
        address redeemer,
        uint256 amount
    ) external onlyOracle {
        require(balanceOf(redeemer, tokenId) >= amount, "Insufficient balance");
        require(block.timestamp < services[tokenId].expiryTimestamp, "Expired");

        // Burn the redeemed tokens
        _burn(redeemer, tokenId, amount);

        uint128 valueRedeemed = uint128(uint256(services[tokenId].price) * amount);

        // Record redemption
        redemptions[tokenId].push(RedemptionRecord({
            tokenId: tokenId,
            redeemer: redeemer,
            timestamp: uint64(block.timestamp),
            valueRedeemed: valueRedeemed,
            completed: true
        }));

        emit ServiceRedeemed(tokenId, redeemer, valueRedeemed);
    }

    /**
     * @notice Handle expired tokens (sweep unused credits)
     * @param tokenId Service token ID
     */
    function handleExpiredService(uint256 tokenId) external {
        ServiceMetadata storage service = services[tokenId];
        require(block.timestamp >= service.expiryTimestamp, "Not expired");
        require(service.active, "Already handled");

        service.active = false;

        emit ServiceExpired(tokenId, service.totalMinted);
    }

    /**
     * @notice Update platform fee (onlyOwner)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        platformFee = newFee;
    }

    /**
     * @notice Update redemption oracle
     */
    function updateOracle(address newOracle) external onlyOwner {
        redemptionOracle = newOracle;
    }

    /**
     * @notice Get service details
     */
    function getServiceInfo(uint256 tokenId) external view returns (
        uint128 price,
        uint64 expiryTimestamp,
        uint32 maxSupply,
        uint32 totalMinted,
        bool active
    ) {
        ServiceMetadata memory service = services[tokenId];
        return (
            service.price,
            service.expiryTimestamp,
            service.maxSupply,
            service.totalMinted,
            service.active
        );
    }

    // ========== DASHBOARD HELPER FUNCTIONS ==========
    // These view functions help frontend display metrics without extra gas

    /**
     * @notice Get total redemptions for a service
     */
    function getRedemptionCount(uint256 tokenId) external view returns (uint256) {
        return redemptions[tokenId].length;
    }

    /**
     * @notice Get redemption rate in basis points (10000 = 100%)
     */
    function getRedemptionRate(uint256 tokenId) external view returns (uint256) {
        ServiceMetadata memory service = services[tokenId];
        if (service.totalMinted == 0) return 0;

        uint256 redeemed = redemptions[tokenId].length;
        return (redeemed * 10000) / service.totalMinted;
    }

    /**
     * @notice Get total revenue from a service
     */
    function getServiceRevenue(uint256 tokenId) external view returns (uint128) {
        ServiceMetadata memory service = services[tokenId];
        uint256 redeemed = redemptions[tokenId].length;
        return uint128(uint256(service.price) * redeemed);
    }

    /**
     * @notice Get comprehensive service statistics in one call
     * @return price Service price per credit
     * @return totalMinted Total credits minted
     * @return totalRedeemed Total credits redeemed
     * @return redemptionRateBps Redemption rate in basis points
     * @return revenue Total revenue generated
     * @return active Whether service is active
     * @return expired Whether service has expired
     */
    function getServiceStats(uint256 tokenId) external view returns (
        uint128 price,
        uint32 totalMinted,
        uint256 totalRedeemed,
        uint256 redemptionRateBps,
        uint128 revenue,
        bool active,
        bool expired
    ) {
        ServiceMetadata memory service = services[tokenId];
        uint256 redeemed = redemptions[tokenId].length;

        return (
            service.price,
            service.totalMinted,
            redeemed,
            service.totalMinted > 0 ? (redeemed * 10000) / service.totalMinted : 0,
            uint128(uint256(service.price) * redeemed),
            service.active,
            block.timestamp >= service.expiryTimestamp
        );
    }

    /**
     * @notice Get provider summary stats
     * @return totalServices Number of services created
     * @return totalValueLocked Total value in active credits
     * @return isVerified Whether provider is verified
     * @return registrationTime When provider registered
     */
    function getProviderStats(address provider) external view returns (
        uint32 totalServices,
        uint128 totalValueLocked,
        bool isVerified,
        uint64 registrationTime
    ) {
        ProviderInfo memory info = providers[provider];
        return (
            info.serviceCount,
            info.totalValueLocked,
            info.verified,
            info.registrationTime
        );
    }

    /**
     * @notice Override ERC1155 uri function to return per-token metadata
     * @param tokenId Token ID to get URI for
     * @return Token metadata URI (IPFS)
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];

        // Return token-specific URI if it exists
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }

        // Fallback to base URI
        return super.uri(tokenId);
    }
}
