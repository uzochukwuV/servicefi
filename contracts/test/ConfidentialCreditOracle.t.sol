// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/ConfidentialCreditOracle.sol";

contract ConfidentialCreditOracleTest is Test {
    ConfidentialCreditOracle public oracle;

    address public admin = address(1);
    address public iexecProxy = address(2);
    address public business = address(3);
    address public operator = address(4);

    bytes32 public datasetHash = keccak256("encrypted-financial-data");
    bytes32 public attestationHash = keccak256("tee-attestation");

    function setUp() public {
        vm.startPrank(admin);
        oracle = new ConfidentialCreditOracle(iexecProxy);
        oracle.grantRole(oracle.OPERATOR_ROLE(), operator);
        vm.stopPrank();
    }

    // ============ Request Tests ============

    function testRequestCreditScore() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        assertTrue(requestId != bytes32(0), "Request ID should not be zero");

        (bool pending, bytes32 storedRequestId) = oracle.hasPendingRequest(business);
        assertTrue(pending, "Should have pending request");
        assertEq(storedRequestId, requestId, "Request IDs should match");
    }

    function testCannotRequestWhilePending() public {
        vm.startPrank(business);

        oracle.requestCreditScore(datasetHash);

        vm.expectRevert(ConfidentialCreditOracle.RequestAlreadyPending.selector);
        oracle.requestCreditScore(keccak256("different-data"));

        vm.stopPrank();
    }

    function testCancelRequest() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        vm.prank(business);
        oracle.cancelRequest(requestId);

        (bool pending,) = oracle.hasPendingRequest(business);
        assertFalse(pending, "Should not have pending request after cancel");
    }

    // ============ Callback Tests ============

    function testSubmitCreditScore() public {
        // Request credit score
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        // Submit score from iExec proxy
        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId,
            850,                    // score
            0,                      // riskTier (A)
            166000 * 1e6,          // maxCreditLine (166K USDC)
            9500,                   // confidence (95%)
            attestationHash
        );

        // Verify score stored
        (
            uint16 score,
            ConfidentialCreditOracle.RiskTier tier,
            uint256 maxCredit,
            uint16 confidence,
            bool valid
        ) = oracle.getCreditScore(business);

        assertEq(score, 850, "Score should be 850");
        assertEq(uint8(tier), 0, "Tier should be A");
        assertEq(maxCredit, 166000 * 1e6, "Max credit should match");
        assertEq(confidence, 9500, "Confidence should be 95%");
        assertTrue(valid, "Score should be valid");
    }

    function testSubmitCreditScoreUnauthorized() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        // Try to submit from unauthorized address
        vm.prank(address(999));
        vm.expectRevert(ConfidentialCreditOracle.UnauthorizedCallback.selector);
        oracle.submitCreditScore(
            requestId,
            850, 0, 166000 * 1e6, 9500, attestationHash
        );
    }

    function testSubmitInvalidScore() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        // Score over 1000 should fail
        vm.prank(iexecProxy);
        vm.expectRevert(ConfidentialCreditOracle.InvalidScore.selector);
        oracle.submitCreditScore(
            requestId,
            1500,  // Invalid: > 1000
            0, 166000 * 1e6, 9500, attestationHash
        );
    }

    // ============ Query Tests ============

    function testGetRiskBasedDiscount() public {
        // Set up score
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        // Test each risk tier
        _submitScoreWithTier(requestId, 0); // Tier A
        assertEq(oracle.getRiskBasedDiscount(business), 1500, "Tier A should get 15%");

        // New request for Tier B
        vm.warp(block.timestamp + 2 hours);
        vm.prank(business);
        requestId = oracle.requestCreditScore(datasetHash);
        _submitScoreWithTier(requestId, 1); // Tier B
        assertEq(oracle.getRiskBasedDiscount(business), 1000, "Tier B should get 10%");

        // New request for Tier F
        vm.warp(block.timestamp + 2 hours);
        vm.prank(business);
        requestId = oracle.requestCreditScore(datasetHash);
        _submitScoreWithTier(requestId, 4); // Tier F
        assertEq(oracle.getRiskBasedDiscount(business), 0, "Tier F should get 0%");
    }

    function testScoreExpiration() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId, 850, 0, 166000 * 1e6, 9500, attestationHash
        );

        // Score valid now
        assertTrue(oracle.hasValidCreditScore(business), "Score should be valid");

        // Warp past expiration (30 days)
        vm.warp(block.timestamp + 31 days);

        // Score should be expired
        assertFalse(oracle.hasValidCreditScore(business), "Score should be expired");
    }

    function testLowConfidenceScore() public {
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        // Submit score with low confidence
        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId,
            850,
            0,
            166000 * 1e6,
            4000,  // 40% confidence (below 50% threshold)
            attestationHash
        );

        // Score should be invalid due to low confidence
        assertFalse(oracle.hasValidCreditScore(business), "Low confidence score should be invalid");
    }

    // ============ Admin Tests ============

    function testSetRequestTimeout() public {
        vm.prank(admin);
        oracle.setRequestTimeout(2 hours);

        assertEq(oracle.requestTimeout(), 2 hours, "Timeout should be updated");
    }

    function testSetScoreValidityPeriod() public {
        vm.prank(admin);
        oracle.setScoreValidityPeriod(60 days);

        assertEq(oracle.scoreValidityPeriod(), 60 days, "Validity should be updated");
    }

    function testInvalidateCreditScore() public {
        // Set up valid score
        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);
        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId, 850, 0, 166000 * 1e6, 9500, attestationHash
        );

        assertTrue(oracle.hasValidCreditScore(business), "Score should be valid");

        // Invalidate
        vm.prank(operator);
        oracle.invalidateCreditScore(business);

        assertFalse(oracle.hasValidCreditScore(business), "Score should be invalidated");
    }

    // ============ Helper Functions ============

    function _submitScoreWithTier(bytes32 requestId, uint8 tier) internal {
        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId,
            850,
            tier,
            166000 * 1e6,
            9500,
            attestationHash
        );
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreditScoreRange(uint16 score) public {
        vm.assume(score <= 1000);

        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId, score, 0, 166000 * 1e6, 9500, attestationHash
        );

        (uint16 storedScore,,,,) = oracle.getCreditScore(business);
        assertEq(storedScore, score, "Score should match");
    }

    function testFuzz_RiskTier(uint8 tier) public {
        vm.assume(tier <= 4);

        vm.prank(business);
        bytes32 requestId = oracle.requestCreditScore(datasetHash);

        vm.prank(iexecProxy);
        oracle.submitCreditScore(
            requestId, 850, tier, 166000 * 1e6, 9500, attestationHash
        );

        (, ConfidentialCreditOracle.RiskTier storedTier,,,) = oracle.getCreditScore(business);
        assertEq(uint8(storedTier), tier, "Tier should match");
    }
}
