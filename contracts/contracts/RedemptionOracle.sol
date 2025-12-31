// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ServiceCreditToken.sol";

/**
 * @title RedemptionOracle
 * @notice Off-chain verification oracle for service redemption
 * @dev Gas-optimized with minimal storage and struct limits
 */
contract RedemptionOracle is AccessControl {

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Verification request (7 fields)
    struct VerificationRequest {
        uint256 tokenId;
        address user;
        uint128 amount;
        uint64 timestamp;
        uint64 expiresAt;
        bytes32 proofHash;      // Hash of off-chain proof
        bool verified;
    }

    // Verifier info (5 fields)
    struct VerifierInfo {
        address verifierAddress;
        uint64 registeredAt;
        uint32 verificationsCount;
        uint16 reputationScore;  // 0-10000
        bool active;
    }

    ServiceCreditToken public serviceCreditToken;

    mapping(bytes32 => VerificationRequest) public requests;
    mapping(address => VerifierInfo) public verifiers;
    mapping(uint256 => uint256) public serviceRedemptions;

    uint256 public verificationTimeout = 1 hours;
    uint256 public minVerifierReputation = 5000; // 50%

    event VerificationRequested(bytes32 indexed requestId, uint256 indexed tokenId, address user);
    event VerificationCompleted(bytes32 indexed requestId, bool approved);
    event VerifierAdded(address indexed verifier);
    event ServiceCreditTokenSet(address indexed token);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Set ServiceCreditToken address (one-time setup)
     */
    function setServiceCreditToken(address _serviceCreditToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(serviceCreditToken) == address(0), "Already set");
        require(_serviceCreditToken != address(0), "Invalid address");
        serviceCreditToken = ServiceCreditToken(_serviceCreditToken);
        emit ServiceCreditTokenSet(_serviceCreditToken);
    }

    /**
     * @notice Request service redemption verification
     * @param tokenId Service token ID
     * @param amount Amount to redeem
     * @param proofHash Hash of off-chain proof (QR code, receipt, etc.)
     */
    function requestVerification(
        uint256 tokenId,
        uint128 amount,
        bytes32 proofHash
    ) external returns (bytes32 requestId) {
        require(serviceCreditToken.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");

        requestId = keccak256(abi.encodePacked(
            tokenId,
            msg.sender,
            amount,
            block.timestamp,
            proofHash
        ));

        require(requests[requestId].timestamp == 0, "Request exists");

        requests[requestId] = VerificationRequest({
            tokenId: tokenId,
            user: msg.sender,
            amount: amount,
            timestamp: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + verificationTimeout),
            proofHash: proofHash,
            verified: false
        });

        emit VerificationRequested(requestId, tokenId, msg.sender);
        return requestId;
    }

    /**
     * @notice Verify and approve redemption (called by verifier)
     * @param requestId Verification request ID
     * @param approved Whether to approve the redemption
     */
    function verifyRedemption(
        bytes32 requestId,
        bool approved
    ) public onlyRole(VERIFIER_ROLE) {
        _verifyRedemption(requestId, approved);
    }

    /**
     * @notice Internal verification logic
     * @param requestId Verification request ID
     * @param approved Whether to approve the redemption
     */
    function _verifyRedemption(
        bytes32 requestId,
        bool approved
    ) internal {
        VerificationRequest storage request = requests[requestId];

        require(request.timestamp > 0, "Invalid request");
        require(!request.verified, "Already verified");
        require(block.timestamp <= request.expiresAt, "Request expired");
        require(verifiers[msg.sender].reputationScore >= minVerifierReputation, "Low reputation");

        request.verified = true;

        if (approved) {
            // Trigger redemption on ServiceCreditToken
            serviceCreditToken.redeemCredit(
                request.tokenId,
                request.user,
                request.amount
            );

            serviceRedemptions[request.tokenId] += request.amount;
        }

        // Update verifier stats
        verifiers[msg.sender].verificationsCount++;

        emit VerificationCompleted(requestId, approved);
    }

    /**
     * @notice Add new verifier
     * @param verifier Verifier address
     * @param initialReputation Initial reputation score (0-10000)
     */
    function addVerifier(
        address verifier,
        uint16 initialReputation
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(initialReputation <= 10000, "Invalid reputation");
        require(!hasRole(VERIFIER_ROLE, verifier), "Already verifier");

        _grantRole(VERIFIER_ROLE, verifier);

        verifiers[verifier] = VerifierInfo({
            verifierAddress: verifier,
            registeredAt: uint64(block.timestamp),
            verificationsCount: 0,
            reputationScore: initialReputation,
            active: true
        });

        emit VerifierAdded(verifier);
    }

    /**
     * @notice Update verifier reputation
     */
    function updateReputation(
        address verifier,
        uint16 newReputation
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newReputation <= 10000, "Invalid reputation");
        verifiers[verifier].reputationScore = newReputation;
    }

    /**
     * @notice Batch verify multiple redemptions (gas efficient)
     * @param requestIds Array of request IDs
     * @param approvals Array of approval decisions
     */
    function batchVerify(
        bytes32[] calldata requestIds,
        bool[] calldata approvals
    ) external onlyRole(VERIFIER_ROLE) {
        require(requestIds.length == approvals.length, "Length mismatch");
        require(requestIds.length <= 50, "Batch too large"); // Gas limit protection

        for (uint256 i = 0; i < requestIds.length; i++) {
            _verifyRedemption(requestIds[i], approvals[i]);
        }
    }

    /**
     * @notice Get verification request details
     */
    function getRequest(bytes32 requestId) external view returns (
        uint256 tokenId,
        address user,
        uint128 amount,
        bool verified
    ) {
        VerificationRequest memory req = requests[requestId];
        return (req.tokenId, req.user, req.amount, req.verified);
    }

    /**
     * @notice Update verification timeout
     */
    function updateTimeout(uint256 newTimeout) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTimeout >= 10 minutes && newTimeout <= 24 hours, "Invalid timeout");
        verificationTimeout = newTimeout;
    }
}
