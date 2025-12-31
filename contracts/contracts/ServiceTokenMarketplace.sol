// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ServiceCreditToken.sol";

/**
 * @title ServiceTokenMarketplace
 * @notice Order book marketplace for trading service tokens with price bounds
 * @dev Enables peer-to-peer trading while maintaining price stability
 */
contract ServiceTokenMarketplace is ReentrancyGuard, Ownable {

    // ========== STRUCTS ==========

    struct Listing {
        uint256 listingId;
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint128 askPrice;       // Price per token in wei
        uint64 createdAt;
        uint64 expiresAt;
        bool active;
    }

    struct Offer {
        uint256 offerId;
        uint256 listingId;
        address buyer;
        uint256 amount;
        uint128 bidPrice;       // Price per token in wei
        uint64 createdAt;
        uint64 expiresAt;
        bool active;
    }

    struct PriceBounds {
        uint128 minPrice;       // Minimum allowed price (e.g., 90% of fixed)
        uint128 maxPrice;       // Maximum allowed price (e.g., 105% of fixed)
        uint128 fixedPrice;     // Reference price from ServiceCreditToken
        uint64 lastUpdated;
        uint16 minPricePct;     // Min price as percentage (basis points)
        uint16 maxPricePct;     // Max price as percentage (basis points)
    }

    struct MarketStats {
        uint256 totalListings;
        uint256 totalTrades;
        uint256 totalVolume;
        uint128 lastTradePrice;
        uint64 lastTradeTime;
    }

    // ========== STATE VARIABLES ==========

    ServiceCreditToken public immutable serviceCreditToken;

    uint256 public nextListingId = 1;
    uint256 public nextOfferId = 1;
    uint256 public marketplaceFee = 200; // 2% in basis points
    address public feeCollector;

    // Storage mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => PriceBounds) public priceBounds;
    mapping(uint256 => MarketStats) public marketStats;

    // User tracking
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userOffers;

    // Token tracking
    mapping(uint256 => uint256[]) public tokenListings;

    // ========== EVENTS ==========

    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 amount,
        uint128 askPrice
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    event ListingPurchased(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint128 price,
        uint256 totalCost
    );

    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint128 bidPrice
    );

    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed seller,
        address buyer,
        uint256 amount,
        uint128 price
    );

    event OfferCancelled(uint256 indexed offerId, address indexed buyer);

    event PriceBoundsUpdated(
        uint256 indexed tokenId,
        uint128 minPrice,
        uint128 maxPrice,
        uint16 minPricePct,
        uint16 maxPricePct
    );

    // ========== CONSTRUCTOR ==========

    constructor(
        address _serviceCreditToken,
        address _feeCollector
    ) Ownable(msg.sender) {
        serviceCreditToken = ServiceCreditToken(_serviceCreditToken);
        feeCollector = _feeCollector;
    }

    // ========== CORE MARKETPLACE FUNCTIONS ==========

    /**
     * @notice Create a listing to sell service tokens
     * @param tokenId Service token ID
     * @param amount Number of tokens to sell
     * @param askPrice Price per token in wei
     * @param durationDays How long listing stays active
     */
    function createListing(
        uint256 tokenId,
        uint256 amount,
        uint128 askPrice,
        uint8 durationDays
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Invalid amount");
        require(durationDays > 0 && durationDays <= 30, "Invalid duration");

        // Ensure price bounds exist (initialize if needed)
        if (priceBounds[tokenId].fixedPrice == 0) {
            _initializePriceBounds(tokenId);
        }

        PriceBounds memory bounds = priceBounds[tokenId];
        require(askPrice >= bounds.minPrice, "Price below minimum");
        require(askPrice <= bounds.maxPrice, "Price above maximum");

        // Check seller has sufficient balance
        require(
            serviceCreditToken.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient balance"
        );

        // Check token is still valid
        (,uint64 expiryTimestamp,,,bool active) = serviceCreditToken.getServiceInfo(tokenId);
        require(active, "Service inactive");
        require(block.timestamp < expiryTimestamp, "Service expired");

        // Transfer tokens to marketplace (escrow)
        serviceCreditToken.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );

        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            askPrice: askPrice,
            createdAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + (durationDays * 1 days)),
            active: true
        });

        userListings[msg.sender].push(listingId);
        tokenListings[tokenId].push(listingId);
        marketStats[tokenId].totalListings++;

        emit ListingCreated(listingId, tokenId, msg.sender, amount, askPrice);
        return listingId;
    }

    /**
     * @notice Buy tokens from a listing at asking price
     * @param listingId ID of the listing to purchase from
     * @param amount Amount of tokens to buy
     */
    function buyListing(
        uint256 listingId,
        uint256 amount
    ) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing inactive");
        require(block.timestamp < listing.expiresAt, "Listing expired");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        uint256 totalCost = uint256(listing.askPrice) * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        // Calculate fees
        uint256 fee = (totalCost * marketplaceFee) / 10000;
        uint256 sellerAmount = totalCost - fee;

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer tokens to buyer
        serviceCreditToken.safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            amount,
            ""
        );

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        payable(feeCollector).transfer(fee);

        // Update market stats
        MarketStats storage stats = marketStats[listing.tokenId];
        stats.totalTrades++;
        stats.totalVolume += totalCost;
        stats.lastTradePrice = listing.askPrice;
        stats.lastTradeTime = uint64(block.timestamp);

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit ListingPurchased(
            listingId,
            listing.tokenId,
            msg.sender,
            listing.seller,
            amount,
            listing.askPrice,
            totalCost
        );
    }

    /**
     * @notice Cancel an active listing
     * @param listingId ID of listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing not active");

        listing.active = false;

        // Return tokens to seller
        serviceCreditToken.safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.amount,
            ""
        );

        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @notice Make an offer on a listing
     * @param listingId Listing to make offer on
     * @param amount Amount of tokens to buy
     * @param bidPrice Price per token willing to pay
     * @param durationDays How long offer stays active
     */
    function makeOffer(
        uint256 listingId,
        uint256 amount,
        uint128 bidPrice,
        uint8 durationDays
    ) external payable nonReentrant returns (uint256) {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing inactive");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        require(durationDays > 0 && durationDays <= 7, "Invalid duration");
        require(msg.sender != listing.seller, "Cannot offer on own listing");

        PriceBounds memory bounds = priceBounds[listing.tokenId];
        require(bidPrice >= bounds.minPrice, "Bid below minimum");
        require(bidPrice < listing.askPrice, "Bid must be below ask");

        uint256 totalCost = uint256(bidPrice) * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        uint256 offerId = nextOfferId++;

        offers[offerId] = Offer({
            offerId: offerId,
            listingId: listingId,
            buyer: msg.sender,
            amount: amount,
            bidPrice: bidPrice,
            createdAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + (durationDays * 1 days)),
            active: true
        });

        userOffers[msg.sender].push(offerId);

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit OfferMade(offerId, listingId, msg.sender, amount, bidPrice);
        return offerId;
    }

    /**
     * @notice Accept an offer on your listing
     * @param offerId ID of offer to accept
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        Listing storage listing = listings[offer.listingId];

        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing inactive");
        require(offer.active, "Offer inactive");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        require(offer.amount <= listing.amount, "Insufficient tokens");

        uint256 totalPrice = uint256(offer.bidPrice) * offer.amount;
        uint256 fee = (totalPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        // Update states
        offer.active = false;
        listing.amount -= offer.amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer tokens to buyer
        serviceCreditToken.safeTransferFrom(
            address(this),
            offer.buyer,
            listing.tokenId,
            offer.amount,
            ""
        );

        // Transfer payment to seller (funds already escrowed from makeOffer)
        payable(msg.sender).transfer(sellerAmount);
        payable(feeCollector).transfer(fee);

        // Update market stats
        MarketStats storage stats = marketStats[listing.tokenId];
        stats.totalTrades++;
        stats.totalVolume += totalPrice;
        stats.lastTradePrice = offer.bidPrice;
        stats.lastTradeTime = uint64(block.timestamp);

        emit OfferAccepted(
            offerId,
            offer.listingId,
            msg.sender,
            offer.buyer,
            offer.amount,
            offer.bidPrice
        );
    }

    /**
     * @notice Cancel an active offer
     * @param offerId ID of offer to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];

        require(offer.buyer == msg.sender, "Not offer owner");
        require(offer.active, "Offer not active");

        offer.active = false;

        // Refund escrowed payment
        uint256 refundAmount = uint256(offer.bidPrice) * offer.amount;
        payable(msg.sender).transfer(refundAmount);

        emit OfferCancelled(offerId, msg.sender);
    }

    // ========== PRICE MANAGEMENT ==========

    /**
     * @notice Initialize price bounds for a token
     * @param tokenId Token to initialize bounds for
     */
    function _initializePriceBounds(uint256 tokenId) internal {
        (uint128 price, uint64 expiryTimestamp,,,) = serviceCreditToken.getServiceInfo(tokenId);
        require(price > 0, "Invalid token");

        uint256 daysToExpiry = (expiryTimestamp - block.timestamp) / 1 days;

        (uint16 minPct, uint16 maxPct) = _calculatePriceBounds(daysToExpiry);

        priceBounds[tokenId] = PriceBounds({
            minPrice: uint128((uint256(price) * minPct) / 10000),
            maxPrice: uint128((uint256(price) * maxPct) / 10000),
            fixedPrice: price,
            lastUpdated: uint64(block.timestamp),
            minPricePct: minPct,
            maxPricePct: maxPct
        });
    }

    /**
     * @notice Calculate price bounds based on days to expiry
     * @param daysToExpiry Days until token expires
     * @return minPct Minimum price as percentage (basis points)
     * @return maxPct Maximum price as percentage (basis points)
     */
    function _calculatePriceBounds(uint256 daysToExpiry) internal pure returns (uint16 minPct, uint16 maxPct) {
        if (daysToExpiry > 60) {
            return (9000, 10500); // 90-105%
        } else if (daysToExpiry > 30) {
            return (8000, 10500); // 80-105%
        } else if (daysToExpiry > 7) {
            return (6000, 10500); // 60-105%
        } else {
            return (3000, 10500); // 30-105% (fire sale)
        }
    }

    /**
     * @notice Update price bounds for a token (anyone can call)
     * @param tokenId Token to update bounds for
     */
    function updatePriceBounds(uint256 tokenId) external {
        (uint128 price, uint64 expiryTimestamp,,,bool active) = serviceCreditToken.getServiceInfo(tokenId);
        require(active, "Service inactive");
        require(block.timestamp < expiryTimestamp, "Service expired");

        uint256 daysToExpiry = (expiryTimestamp - block.timestamp) / 1 days;
        (uint16 minPct, uint16 maxPct) = _calculatePriceBounds(daysToExpiry);

        priceBounds[tokenId] = PriceBounds({
            minPrice: uint128((uint256(price) * minPct) / 10000),
            maxPrice: uint128((uint256(price) * maxPct) / 10000),
            fixedPrice: price,
            lastUpdated: uint64(block.timestamp),
            minPricePct: minPct,
            maxPricePct: maxPct
        });

        emit PriceBoundsUpdated(tokenId, priceBounds[tokenId].minPrice, priceBounds[tokenId].maxPrice, minPct, maxPct);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Get all active listings for a token
     * @param tokenId Token to get listings for
     * @return activeListings Array of listing IDs
     */
    function getActiveListings(uint256 tokenId) external view returns (uint256[] memory) {
        uint256[] memory allListings = tokenListings[tokenId];
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active && block.timestamp < listings[allListings[i]].expiresAt) {
                activeCount++;
            }
        }

        // Build array of active listing IDs
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active && block.timestamp < listings[allListings[i]].expiresAt) {
                activeListings[index++] = allListings[i];
            }
        }

        return activeListings;
    }

    /**
     * @notice Get best ask price (lowest listing price) for a token
     * @param tokenId Token to check
     * @return bestAsk Lowest ask price, 0 if no listings
     */
    function getBestAsk(uint256 tokenId) external view returns (uint128 bestAsk) {
        uint256[] memory allListings = tokenListings[tokenId];
        bestAsk = type(uint128).max;

        for (uint256 i = 0; i < allListings.length; i++) {
            Listing memory listing = listings[allListings[i]];
            if (listing.active && block.timestamp < listing.expiresAt) {
                if (listing.askPrice < bestAsk) {
                    bestAsk = listing.askPrice;
                }
            }
        }

        return bestAsk == type(uint128).max ? 0 : bestAsk;
    }

    /**
     * @notice Get user's active listings
     * @param user User address
     * @return Array of listing IDs
     */
    function getUserActiveListings(address user) external view returns (uint256[] memory) {
        uint256[] memory allUserListings = userListings[user];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allUserListings.length; i++) {
            if (listings[allUserListings[i]].active) {
                activeCount++;
            }
        }

        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allUserListings.length; i++) {
            if (listings[allUserListings[i]].active) {
                activeListings[index++] = allUserListings[i];
            }
        }

        return activeListings;
    }

    /**
     * @notice Get suggested price based on time to expiry
     * @param tokenId Token to get suggested price for
     * @return Suggested selling price
     */
    function getSuggestedPrice(uint256 tokenId) external view returns (uint128) {
        (uint128 price, uint64 expiryTimestamp,,,) = serviceCreditToken.getServiceInfo(tokenId);

        uint256 daysLeft = (expiryTimestamp - block.timestamp) / 1 days;

        if (daysLeft <= 7) return uint128((uint256(price) * 70) / 100);  // 30% off
        if (daysLeft <= 30) return uint128((uint256(price) * 85) / 100); // 15% off
        if (daysLeft <= 60) return uint128((uint256(price) * 92) / 100); // 8% off
        return uint128((uint256(price) * 98) / 100);                      // 2% off
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Update marketplace fee (onlyOwner)
     * @param newFee New fee in basis points
     */
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        marketplaceFee = newFee;
    }

    /**
     * @notice Update fee collector address (onlyOwner)
     * @param newCollector New fee collector address
     */
    function updateFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }

    /**
     * @notice Required for receiving ERC1155 tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @notice Required for receiving batch ERC1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
