// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/ServiceCreditToken.sol";
import "../contracts/RedemptionOracle.sol";

/**
 * @title ServiceCreditTokenTest
 * @notice Comprehensive test suite with gas benchmarks
 */
contract ServiceCreditTokenTest is Test {
    ServiceCreditToken public sct;
    RedemptionOracle public oracle;

    address public owner = address(1);
    address public feeCollector = address(2);
    address public provider1 = address(3);
    address public customer1 = address(4);
    address public verifier1 = address(5);

    uint128 public constant SERVICE_PRICE = 0.01 ether;
    uint64 public constant EXPIRY_OFFSET = 30 days;
    uint32 public constant MAX_SUPPLY = 1000;

    event ServiceCreated(uint256 indexed tokenId, address indexed provider, uint128 price);
    event ServiceRedeemed(uint256 indexed tokenId, address indexed redeemer, uint128 value);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy oracle first (with temp address)
        oracle = new RedemptionOracle();

        // Deploy ServiceCreditToken
        sct = new ServiceCreditToken(
            "https://api.servicefi.io/metadata/",
            feeCollector,
            address(oracle)
        );

        // Update oracle with correct SCT address
        // oracle = new RedemptionOracle(address(sct));
        sct.updateOracle(address(oracle));

        vm.stopPrank();

        // Fund test accounts
        vm.deal(provider1, 10 ether);
        vm.deal(customer1, 10 ether);
    }

    function testProviderRegistration() public {
        vm.prank(provider1);
        sct.registerProvider();

        (
            address providerAddress,
            uint128 totalValueLocked,
            uint64 registrationTime,
            uint32 serviceCount,
            bool verified,
            bool active
        ) = sct.providers(provider1);

        assertEq(providerAddress, provider1);
        assertEq(totalValueLocked, 0);
        assertEq(serviceCount, 0);
        assertEq(verified, false);
        assertEq(active, true);
    }

    function testCannotRegisterTwice() public {
        vm.startPrank(provider1);
        sct.registerProvider();

        vm.expectRevert("Already registered");
        sct.registerProvider();
        vm.stopPrank();
    }

    function testCreateService() public {
        vm.startPrank(provider1);
        sct.registerProvider();

        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            MAX_SUPPLY,
            1, // service type
            "ipfs://QmTest123" // tokenURI
        );

        assertEq(tokenId, 1);

        (
            uint128 price,
            uint64 expiryTimestamp,
            uint32 maxSupply,
            uint32 totalMinted,
            bool active
        ) = sct.getServiceInfo(tokenId);

        assertEq(price, SERVICE_PRICE);
        assertEq(maxSupply, MAX_SUPPLY);
        assertEq(totalMinted, 0);
        assertEq(active, true);

        vm.stopPrank();
    }

    function testMintCredit() public {
        // Setup service
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        // Customer mints
        uint256 amount = 5;
        uint256 totalCost = SERVICE_PRICE * amount;

        uint256 feeCollectorBalanceBefore = feeCollector.balance;

        vm.prank(customer1);
        sct.mintCredit{value: totalCost}(tokenId, amount);

        // Check balance
        assertEq(sct.balanceOf(customer1, tokenId), amount);

        // Check fee was collected
        assertGt(feeCollector.balance, feeCollectorBalanceBefore);

        // Check total minted
        (,,, uint32 totalMinted,) = sct.getServiceInfo(tokenId);
        assertEq(totalMinted, amount);
    }

    function testMintCreditGasBenchmark() public {
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        uint256 gasBefore = gasleft();

        vm.prank(customer1);
        sct.mintCredit{value: SERVICE_PRICE}(tokenId, 1);

        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for minting 1 credit:", gasUsed);

        // Should be under 150k gas for efficient operation
        assertLt(gasUsed, 150000);
    }

    function testCannotMintExpiredService() public {
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + 1 days),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        // Warp past expiry
        vm.warp(block.timestamp + 2 days);

        vm.prank(customer1);
        vm.expectRevert("Service expired");
        sct.mintCredit{value: SERVICE_PRICE}(tokenId, 1);
    }

    function testCannotExceedMaxSupply() public {
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            10, // small max supply
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        vm.prank(customer1);
        vm.expectRevert("Exceeds max supply");
        sct.mintCredit{value: SERVICE_PRICE * 11}(tokenId, 11);
    }

    function testRedeemCredit() public {
        // Setup
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + EXPIRY_OFFSET),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        // Mint
        vm.prank(customer1);
        sct.mintCredit{value: SERVICE_PRICE}(tokenId, 1);

        // Setup oracle verifier
        vm.prank(owner);
        oracle.addVerifier(verifier1, 10000);

        // Redeem via oracle
        vm.prank(address(oracle));
        sct.redeemCredit(tokenId, customer1, 1);

        // Check balance is 0 after redemption
        assertEq(sct.balanceOf(customer1, tokenId), 0);
    }

    function testHandleExpiredService() public {
        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            SERVICE_PRICE,
            uint64(block.timestamp + 1 days),
            MAX_SUPPLY,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        // Warp past expiry
        vm.warp(block.timestamp + 2 days);

        sct.handleExpiredService(tokenId);

        (,,,, bool active) = sct.getServiceInfo(tokenId);
        assertEq(active, false);
    }

    function testUpdatePlatformFee() public {
        vm.prank(owner);
        sct.updatePlatformFee(100); // 1%

        assertEq(sct.platformFee(), 100);
    }

    function testCannotSetFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        sct.updatePlatformFee(600); // 6% - exceeds 5% max
    }

    function testFuzzMintCredit(uint128 price, uint32 amount) public {
        vm.assume(price > 0 && price < 1 ether);
        vm.assume(amount > 0 && amount < 100);

        vm.startPrank(provider1);
        sct.registerProvider();
        uint256 tokenId = sct.createService(
            price,
            uint64(block.timestamp + EXPIRY_OFFSET),
            1000,
            1,
            "ipfs://QmTest123"
        );
        vm.stopPrank();

        uint256 totalCost = uint256(price) * amount;
        vm.deal(customer1, totalCost + 1 ether);

        vm.prank(customer1);
        sct.mintCredit{value: totalCost}(tokenId, amount);

        assertEq(sct.balanceOf(customer1, tokenId), amount);
    }
}
