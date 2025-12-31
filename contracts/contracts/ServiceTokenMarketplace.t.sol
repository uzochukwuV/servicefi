// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "./ServiceCreditToken.sol";
import "./ServiceTokenMarketplace.sol";
import "./RedemptionOracle.sol";

contract ServiceTokenMarketplaceTest is Test {
    ServiceCreditToken public sct;
    ServiceTokenMarketplace public marketplace;
    RedemptionOracle public oracle;

    address public owner = address(this);
    address public provider1 = address(0x1);
    address public customer1 = address(0x2);
    address public customer2 = address(0x3);
    address public feeCollector = address(0x4);

    uint128 public constant SERVICE_PRICE = 50 ether;
    uint64 public constant EXPIRY_OFFSET = 90 days;
    uint32 public constant MAX_SUPPLY = 100;

    function setUp() public {
        // Deploy contracts
        oracle = new RedemptionOracle();
        sct = new ServiceCreditToken(
            "https://api.servicefi.io/metadata/{id}.json",
            feeCollector,
            address(oracle)
        );
        oracle.setServiceCreditToken(address(sct));

        marketplace = new ServiceTokenMarketplace(address(sct), feeCollector);

        // Fund accounts
        vm.deal(provider1, 100 ether);
        vm.deal(customer1, 100 ether);
        vm.deal(customer2, 100 ether);

        // Register provider and create service
        vm.startPrank(provider1);
        sct.registerProvider();
        sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        // Customer1 mints some tokens
        vm.prank(customer1);
        sct.mintCredit{value: SERVICE_PRICE * 10}(1, 10);
    }

    // ========== LISTING TESTS ==========

    function testCreateListing() public {
        vm.startPrank(customer1);

        // Approve marketplace
        sct.setApprovalForAll(address(marketplace), true);

        // Create listing
        uint256 listingId = marketplace.createListing(
            1,           // tokenId
            5,           // amount
            48 ether,    // askPrice (4% discount)
            7            // durationDays
        );

        assertEq(listingId, 1, "Listing ID should be 1");

        // Check listing details
        (
            uint256 id,
            address seller,
            uint256 tokenId,
            uint256 amount,
            uint128 askPrice,
            ,
            ,
            bool active
        ) = marketplace.listings(listingId);

        assertEq(id, 1, "Listing ID mismatch");
        assertEq(seller, customer1, "Seller mismatch");
        assertEq(tokenId, 1, "Token ID mismatch");
        assertEq(amount, 5, "Amount mismatch");
        assertEq(askPrice, 48 ether, "Ask price mismatch");
        assertTrue(active, "Listing should be active");

        // Check balance (tokens in escrow)
        assertEq(sct.balanceOf(customer1, 1), 5, "Should have 5 tokens left");
        assertEq(sct.balanceOf(address(marketplace), 1), 5, "Marketplace should have 5 tokens");

        vm.stopPrank();
    }

    function testCreateListingBelowMinPrice() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        // Try to create listing below minimum price (90% = 45 ether)
        vm.expectRevert("Price below minimum");
        marketplace.createListing(1, 5, 40 ether, 7);

        vm.stopPrank();
    }

    function testCreateListingAboveMaxPrice() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        // Try to create listing above maximum price (105% = 52.5 ether)
        vm.expectRevert("Price above maximum");
        marketplace.createListing(1, 5, 60 ether, 7);

        vm.stopPrank();
    }

    function testBuyListing() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        uint256 customer1BalanceBefore = customer1.balance;

        // Customer2 buys from listing
        vm.prank(customer2);
        marketplace.buyListing{value: 48 ether * 3}(listingId, 3);

        // Check token balances
        assertEq(sct.balanceOf(customer2, 1), 3, "Customer2 should have 3 tokens");
        assertEq(sct.balanceOf(address(marketplace), 1), 2, "Marketplace should have 2 tokens left");

        // Check payment (minus 2% fee)
        uint256 expectedPayment = (48 ether * 3 * 98) / 100; // 98% after 2% fee
        assertEq(
            customer1.balance,
            customer1BalanceBefore + expectedPayment,
            "Customer1 should receive payment"
        );

        // Check listing updated
        (,,, uint256 remainingAmount,,,, bool active) = marketplace.listings(listingId);
        assertEq(remainingAmount, 2, "Should have 2 tokens remaining");
        assertTrue(active, "Listing should still be active");
    }

    function testBuyListingCompletely() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        // Customer2 buys all tokens
        vm.prank(customer2);
        marketplace.buyListing{value: 48 ether * 5}(listingId, 5);

        // Check listing is now inactive
        (,,,,,,, bool active) = marketplace.listings(listingId);
        assertFalse(active, "Listing should be inactive after full purchase");

        assertEq(sct.balanceOf(customer2, 1), 5, "Customer2 should have all 5 tokens");
    }

    function testCancelListing() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);

        // Cancel listing
        marketplace.cancelListing(listingId);

        // Check listing is inactive
        (,,,,,,, bool active) = marketplace.listings(listingId);
        assertFalse(active, "Listing should be inactive");

        // Check tokens returned
        assertEq(sct.balanceOf(customer1, 1), 10, "Tokens should be returned");
        assertEq(sct.balanceOf(address(marketplace), 1), 0, "Marketplace should have no tokens");

        vm.stopPrank();
    }

    function testCannotBuyOwnListing() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);

        // Try to buy own listing
        vm.expectRevert("Cannot buy own listing");
        marketplace.buyListing{value: 48 ether}(listingId, 1);

        vm.stopPrank();
    }

    // ========== OFFER TESTS ==========

    function testMakeOffer() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        // Customer2 makes offer
        vm.prank(customer2);
        uint256 offerId = marketplace.makeOffer{value: 46 ether * 3}(
            listingId,
            3,         // amount
            46 ether,  // bidPrice
            3          // durationDays
        );

        assertEq(offerId, 1, "Offer ID should be 1");

        // Check offer details
        (
            uint256 id,
            uint256 offerListingId,
            address buyer,
            uint256 amount,
            uint128 bidPrice,
            ,
            ,
            bool active
        ) = marketplace.offers(offerId);

        assertEq(id, 1, "Offer ID mismatch");
        assertEq(offerListingId, listingId, "Listing ID mismatch");
        assertEq(buyer, customer2, "Buyer mismatch");
        assertEq(amount, 3, "Amount mismatch");
        assertEq(bidPrice, 46 ether, "Bid price mismatch");
        assertTrue(active, "Offer should be active");
    }

    function testAcceptOffer() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        // Customer2 makes offer
        vm.prank(customer2);
        uint256 offerId = marketplace.makeOffer{value: 46 ether * 3}(
            listingId,
            3,
            46 ether,
            3
        );

        uint256 customer1BalanceBefore = customer1.balance;

        // Customer1 accepts offer
        vm.prank(customer1);
        marketplace.acceptOffer(offerId);

        // Check tokens transferred
        assertEq(sct.balanceOf(customer2, 1), 3, "Customer2 should have 3 tokens");
        assertEq(sct.balanceOf(address(marketplace), 1), 2, "Marketplace should have 2 tokens");

        // Check payment (minus 2% fee)
        uint256 expectedPayment = (46 ether * 3 * 98) / 100;
        assertEq(
            customer1.balance,
            customer1BalanceBefore + expectedPayment,
            "Customer1 should receive payment"
        );

        // Check offer is inactive
        (,,,,,,, bool offerActive) = marketplace.offers(offerId);
        assertFalse(offerActive, "Offer should be inactive");

        // Check listing updated
        (,,, uint256 remainingAmount,,,, bool listingActive) = marketplace.listings(listingId);
        assertEq(remainingAmount, 2, "Should have 2 tokens remaining");
        assertTrue(listingActive, "Listing should still be active");
    }

    function testCancelOffer() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        // Customer2 makes offer
        vm.startPrank(customer2);
        uint256 balanceBefore = customer2.balance;
        uint256 offerId = marketplace.makeOffer{value: 46 ether * 3}(
            listingId,
            3,
            46 ether,
            3
        );

        // Cancel offer
        marketplace.cancelOffer(offerId);

        // Check refund
        assertEq(customer2.balance, balanceBefore, "Should be refunded");

        // Check offer is inactive
        (,,,,,,, bool active) = marketplace.offers(offerId);
        assertFalse(active, "Offer should be inactive");

        vm.stopPrank();
    }

    function testCannotMakeOfferAboveAsk() public {
        // Customer1 creates listing
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        uint256 listingId = marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        // Customer2 tries to make offer at or above ask price
        vm.prank(customer2);
        vm.expectRevert("Bid must be below ask");
        marketplace.makeOffer{value: 48 ether * 3}(listingId, 3, 48 ether, 3);
    }

    // ========== PRICE BOUNDS TESTS ==========

    function testPriceBoundsInitialization() public {
        // Price bounds should be initialized when first listing is created
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);
        marketplace.createListing(1, 5, 48 ether, 7);
        vm.stopPrank();

        (
            uint128 minPrice,
            uint128 maxPrice,
            uint128 fixedPrice,
            ,
            uint16 minPricePct,
            uint16 maxPricePct
        ) = marketplace.priceBounds(1);

        assertEq(fixedPrice, SERVICE_PRICE, "Fixed price should match service price");
        assertEq(minPrice, (SERVICE_PRICE * 9000) / 10000, "Min price should be 90%");
        assertEq(maxPrice, (SERVICE_PRICE * 10500) / 10000, "Max price should be 105%");
        assertEq(minPricePct, 9000, "Min percentage should be 90%");
        assertEq(maxPricePct, 10500, "Max percentage should be 105%");
    }

    function testUpdatePriceBounds() public {
        // Initialize bounds
        vm.prank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        // Fast forward to 25 days before expiry (should trigger tighter bounds)
        vm.warp(block.timestamp + 65 days);

        // Update bounds
        marketplace.updatePriceBounds(1);

        (
            uint128 minPrice,
            uint128 maxPrice,
            ,
            ,
            uint16 minPricePct,
            uint16 maxPricePct
        ) = marketplace.priceBounds(1);

        // At 25 days left, bounds should be 60-105%
        assertEq(minPricePct, 6000, "Min percentage should be 60%");
        assertEq(maxPricePct, 10500, "Max percentage should be 105%");
        assertEq(minPrice, (SERVICE_PRICE * 6000) / 10000, "Min price updated");
        assertEq(maxPrice, (SERVICE_PRICE * 10500) / 10000, "Max price updated");
    }

    function testGetSuggestedPrice() public {
        // At 90 days: should suggest 98% (2% discount)
        uint128 suggested = marketplace.getSuggestedPrice(1);
        assertEq(suggested, (SERVICE_PRICE * 98) / 100, "Should suggest 2% discount");

        // Fast forward to 50 days left: should suggest 92% (8% discount)
        vm.warp(block.timestamp + 40 days);
        suggested = marketplace.getSuggestedPrice(1);
        assertEq(suggested, (SERVICE_PRICE * 92) / 100, "Should suggest 8% discount");

        // Fast forward to 20 days left: should suggest 85% (15% discount)
        vm.warp(block.timestamp + 30 days);
        suggested = marketplace.getSuggestedPrice(1);
        assertEq(suggested, (SERVICE_PRICE * 85) / 100, "Should suggest 15% discount");

        // Fast forward to 5 days left: should suggest 70% (30% discount)
        vm.warp(block.timestamp + 15 days);
        suggested = marketplace.getSuggestedPrice(1);
        assertEq(suggested, (SERVICE_PRICE * 70) / 100, "Should suggest 30% discount");
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testGetActiveListings() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        // Create multiple listings
        marketplace.createListing(1, 2, 48 ether, 7);
        marketplace.createListing(1, 3, 49 ether, 7);

        vm.stopPrank();

        uint256[] memory activeListings = marketplace.getActiveListings(1);
        assertEq(activeListings.length, 2, "Should have 2 active listings");
    }

    function testGetBestAsk() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        marketplace.createListing(1, 2, 49 ether, 7);
        marketplace.createListing(1, 3, 48 ether, 7);
        marketplace.createListing(1, 1, 50 ether, 7);

        vm.stopPrank();

        uint128 bestAsk = marketplace.getBestAsk(1);
        assertEq(bestAsk, 48 ether, "Best ask should be lowest price");
    }

    function testGetUserActiveListings() public {
        vm.startPrank(customer1);
        sct.setApprovalForAll(address(marketplace), true);

        marketplace.createListing(1, 2, 48 ether, 7);
        marketplace.createListing(1, 3, 49 ether, 7);

        vm.stopPrank();

        uint256[] memory userListings = marketplace.getUserActiveListings(customer1);
        assertEq(userListings.length, 2, "Customer1 should have 2 active listings");
    }

    // ========== ADMIN TESTS ==========

    function testUpdateMarketplaceFee() public {
        marketplace.updateMarketplaceFee(300); // 3%

        assertEq(marketplace.marketplaceFee(), 300, "Fee should be updated");
    }

    function testCannotSetFeeTooHigh() public {
        vm.expectRevert("Fee too high");
        marketplace.updateMarketplaceFee(600); // 6% - exceeds 5% max
    }

    function testUpdateFeeCollector() public {
        address newCollector = address(0x999);
        marketplace.updateFeeCollector(newCollector);

        assertEq(marketplace.feeCollector(), newCollector, "Fee collector should be updated");
    }
}
