// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ServiceCreditToken.sol";

/**
 * @title ConfidentialRedemptionOracle
 * @notice Privacy-preserving service redemption using iExec TEE
 * @dev Integrates iExec confidential computing for sensitive verification data
 */
contract ConfidentialRedemptionOracle is AccessControl {

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // iExec integration
    address public iexecProxy;
    mapping(bytes32 => bool) public authorizedApps;

    struct VerificationRequest {
        uint256 tokenId;
        address user;
        uint128 amount;
        uint64 timestamp;
        uint64 expiresAt;
        bytes32 confidentialDataHash;  // Hash of encrypted sensitive data
        bool verified;
    }

    struct ConfidentialResult {
        bytes32 requestId;
        bool approved;
        uint256 confidenceScore;  // 0-10000 (computed privately in TEE)
        bytes32 proofHash;
    }

    ServiceCreditToken public serviceCreditToken;
    mapping(bytes32 => VerificationRequest) public requests;
    mapping(bytes32 => ConfidentialResult) public results;

    event VerificationRequested(bytes32 indexed requestId, uint256 indexed tokenId, address user);
    event ConfidentialVerificationCompleted(bytes32 indexed requestId, bool approved, uint256 confidenceScore);

    constructor(address _iexecProxy) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        iexecProxy = _iexecProxy;
    }

    /**
     * @notice Request confidential verification with sensitive business data
     * @param tokenId Service token ID
     * @param amount Amount to redeem
     * @param confidentialDataHash Hash of encrypted customer/business data
     */
    function requestConfidentialVerification(
        uint256 tokenId,
        uint128 amount,
        bytes32 confidentialDataHash
    ) external returns (bytes32 requestId) {
        require(serviceCreditToken.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");

        requestId = keccak256(abi.encodePacked(
            tokenId,
            msg.sender,
            amount,
            block.timestamp,
            confidentialDataHash
        ));

        requests[requestId] = VerificationRequest({
            tokenId: tokenId,
            user: msg.sender,
            amount: amount,
            timestamp: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + 1 hours),
            confidentialDataHash: confidentialDataHash,
            verified: false
        });

        emit VerificationRequested(requestId, tokenId, msg.sender);
        return requestId;
    }

    /**
     * @notice Callback from iExec TEE with confidential verification result
     * @param requestId Original request ID
     * @param approved Verification result from TEE
     * @param confidenceScore Confidence level (computed privately)
     * @param proofHash Cryptographic proof from TEE
     */
    function submitConfidentialResult(
        bytes32 requestId,
        bool approved,
        uint256 confidenceScore,
        bytes32 proofHash
    ) external {
        require(msg.sender == iexecProxy || hasRole(VERIFIER_ROLE, msg.sender), "Unauthorized");
        
        VerificationRequest storage request = requests[requestId];
        require(request.timestamp > 0, "Invalid request");
        require(!request.verified, "Already verified");
        require(block.timestamp <= request.expiresAt, "Request expired");

        request.verified = true;
        
        results[requestId] = ConfidentialResult({
            requestId: requestId,
            approved: approved,
            confidenceScore: confidenceScore,
            proofHash: proofHash
        });

        if (approved && confidenceScore >= 7500) { // 75% confidence threshold
            serviceCreditToken.redeemCredit(
                request.tokenId,
                request.user,
                request.amount
            );
        }

        emit ConfidentialVerificationCompleted(requestId, approved, confidenceScore);
    }

    /**
     * @notice Authorize iExec app for verification
     */
    function authorizeApp(bytes32 appHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedApps[appHash] = true;
    }
}