// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConfidentialCreditOracle
 * @notice Privacy-preserving credit scoring using iExec TEE
 * @dev Integrates with ServiceFi's confidential credit scoring iApp
 *
 * Flow:
 * 1. Business submits encrypted financial data to iExec
 * 2. TEE computes credit score privately (data never exposed)
 * 3. Oracle receives callback with score + attestation
 * 4. LiquidityPool queries oracle for credit decisions
 */
contract ConfidentialCreditOracle is AccessControl, ReentrancyGuard {

    // ============ Roles ============
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant IEXEC_CALLBACK_ROLE = keccak256("IEXEC_CALLBACK_ROLE");

    // ============ Enums ============
    enum RiskTier { A, B, C, D, F }
    enum RequestStatus { Pending, Completed, Expired, Cancelled }

    // ============ Structs ============

    /**
     * @notice Credit score result from TEE computation
     * @dev Only aggregated results stored, never raw financial data
     */
    struct CreditScore {
        uint16 score;              // 0-1000 credit score
        RiskTier riskTier;         // A/B/C/D/F classification
        uint256 maxCreditLine;     // Maximum credit in wei (MNT 18 decimals)
        uint16 confidence;         // 0-10000 (basis points)
        uint64 computedAt;         // Timestamp of computation
        uint64 expiresAt;          // Score validity expiration
        bytes32 attestationHash;   // TEE attestation proof
        bool valid;                // Score is valid and not expired
    }

    /**
     * @notice Credit score request tracking
     */
    struct CreditRequest {
        address business;          // Business requesting score
        bytes32 datasetHash;       // Hash of encrypted financial data
        uint64 requestedAt;        // Request timestamp
        uint64 expiresAt;          // Request expiration
        RequestStatus status;      // Current status
        bytes32 taskId;            // iExec task ID (if submitted)
    }

    // ============ State Variables ============

    // iExec integration
    address public iexecProxy;
    bytes32 public authorizedAppHash;

    // Configuration
    uint256 public requestTimeout = 1 hours;
    uint256 public scoreValidityPeriod = 30 days;
    uint256 public minConfidenceThreshold = 5000; // 50%

    // Credit score storage
    mapping(address => CreditScore) public creditScores;
    mapping(bytes32 => CreditRequest) public creditRequests;
    mapping(address => bytes32) public pendingRequests; // business => requestId

    // Statistics
    uint256 public totalScoresComputed;
    uint256 public totalRequestsSubmitted;

    // ============ Events ============

    event CreditScoreRequested(
        bytes32 indexed requestId,
        address indexed business,
        bytes32 datasetHash
    );

    event CreditScoreReceived(
        bytes32 indexed requestId,
        address indexed business,
        uint16 score,
        RiskTier riskTier,
        uint256 maxCreditLine
    );

    event CreditScoreExpired(address indexed business);
    event RequestCancelled(bytes32 indexed requestId);
    event ConfigUpdated(string param, uint256 value);

    // ============ Errors ============

    error InvalidAddress();
    error RequestAlreadyPending();
    error RequestNotFound();
    error RequestExpired();
    error RequestAlreadyCompleted();
    error UnauthorizedCallback();
    error InvalidScore();
    error ScoreNotFound();
    error ScoreExpired();
    error InsufficientConfidence();

    // ============ Constructor ============

    constructor(address _iexecProxy) {
        if (_iexecProxy == address(0)) revert InvalidAddress();

        iexecProxy = _iexecProxy;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(IEXEC_CALLBACK_ROLE, _iexecProxy);
    }

    // ============ Business Functions ============

    /**
     * @notice Request a confidential credit score computation
     * @param datasetHash Hash of the encrypted financial data on iExec
     * @return requestId Unique identifier for tracking the request
     *
     * @dev Business must have already:
     * 1. Encrypted their financial data
     * 2. Uploaded to iExec as protected data
     * 3. Received a dataset hash
     */
    function requestCreditScore(
        bytes32 datasetHash
    ) external nonReentrant returns (bytes32 requestId) {
        // Check no pending request exists
        if (pendingRequests[msg.sender] != bytes32(0)) {
            bytes32 existingRequest = pendingRequests[msg.sender];
            CreditRequest storage existing = creditRequests[existingRequest];

            // Allow new request only if previous expired
            if (existing.status == RequestStatus.Pending &&
                block.timestamp <= existing.expiresAt) {
                revert RequestAlreadyPending();
            }
        }

        // Generate unique request ID
        requestId = keccak256(abi.encodePacked(
            msg.sender,
            datasetHash,
            block.timestamp,
            block.number
        ));

        // Store request
        creditRequests[requestId] = CreditRequest({
            business: msg.sender,
            datasetHash: datasetHash,
            requestedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + requestTimeout),
            status: RequestStatus.Pending,
            taskId: bytes32(0)
        });

        pendingRequests[msg.sender] = requestId;
        totalRequestsSubmitted++;

        emit CreditScoreRequested(requestId, msg.sender, datasetHash);
        return requestId;
    }

    /**
     * @notice Cancel a pending credit score request
     * @param requestId The request to cancel
     */
    function cancelRequest(bytes32 requestId) external {
        CreditRequest storage request = creditRequests[requestId];

        if (request.business != msg.sender && !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedCallback();
        }
        if (request.status != RequestStatus.Pending) {
            revert RequestAlreadyCompleted();
        }

        request.status = RequestStatus.Cancelled;
        delete pendingRequests[request.business];

        emit RequestCancelled(requestId);
    }

    // ============ iExec Callback Functions ============

    /**
     * @notice Callback from iExec TEE with credit score result
     * @param requestId Original request ID
     * @param score Credit score (0-1000)
     * @param riskTier Risk classification (0=A, 1=B, 2=C, 3=D, 4=F)
     * @param maxCreditLine Maximum credit line in USDC (6 decimals)
     * @param confidence Confidence level (0-10000 basis points)
     * @param attestationHash TEE attestation proof
     *
     * @dev Only callable by iExec proxy or authorized operators
     */
    function submitCreditScore(
        bytes32 requestId,
        uint16 score,
        uint8 riskTier,
        uint256 maxCreditLine,
        uint16 confidence,
        bytes32 attestationHash
    ) external {
        // Authorization check
        if (!hasRole(IEXEC_CALLBACK_ROLE, msg.sender) &&
            !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedCallback();
        }

        CreditRequest storage request = creditRequests[requestId];

        // Validate request
        if (request.requestedAt == 0) revert RequestNotFound();
        if (request.status != RequestStatus.Pending) revert RequestAlreadyCompleted();
        if (block.timestamp > request.expiresAt) {
            request.status = RequestStatus.Expired;
            revert RequestExpired();
        }

        // Validate score
        if (score > 1000) revert InvalidScore();
        if (riskTier > 4) revert InvalidScore();

        // Update request status
        request.status = RequestStatus.Completed;
        delete pendingRequests[request.business];

        // Store credit score
        creditScores[request.business] = CreditScore({
            score: score,
            riskTier: RiskTier(riskTier),
            maxCreditLine: maxCreditLine,
            confidence: confidence,
            computedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + scoreValidityPeriod),
            attestationHash: attestationHash,
            valid: true
        });

        totalScoresComputed++;

        emit CreditScoreReceived(
            requestId,
            request.business,
            score,
            RiskTier(riskTier),
            maxCreditLine
        );
    }

    /**
     * @notice Link iExec task ID to request (for tracking)
     * @param requestId The credit request
     * @param taskId iExec task identifier
     */
    function linkTaskId(
        bytes32 requestId,
        bytes32 taskId
    ) external onlyRole(OPERATOR_ROLE) {
        CreditRequest storage request = creditRequests[requestId];
        if (request.requestedAt == 0) revert RequestNotFound();
        request.taskId = taskId;
    }

    // ============ Query Functions ============

    /**
     * @notice Get credit score for a business
     * @param business Address to query
     * @return score Credit score (0-1000)
     * @return riskTier Risk classification
     * @return maxCreditLine Maximum credit amount
     * @return confidence Confidence level
     * @return valid Whether score is valid and not expired
     */
    function getCreditScore(address business) external view returns (
        uint16 score,
        RiskTier riskTier,
        uint256 maxCreditLine,
        uint16 confidence,
        bool valid
    ) {
        CreditScore storage cs = creditScores[business];

        bool isValid = cs.valid &&
                       cs.computedAt > 0 &&
                       block.timestamp <= cs.expiresAt &&
                       cs.confidence >= minConfidenceThreshold;

        return (
            cs.score,
            cs.riskTier,
            cs.maxCreditLine,
            cs.confidence,
            isValid
        );
    }

    /**
     * @notice Check if business has valid credit score
     * @param business Address to check
     * @return hasValid True if valid score exists
     */
    function hasValidCreditScore(address business) external view returns (bool hasValid) {
        CreditScore storage cs = creditScores[business];
        return cs.valid &&
               cs.computedAt > 0 &&
               block.timestamp <= cs.expiresAt &&
               cs.confidence >= minConfidenceThreshold;
    }

    /**
     * @notice Get risk-based discount rate for LiquidityPool integration
     * @param business Address to query
     * @return discountBps Discount in basis points (e.g., 1000 = 10%)
     *
     * @dev Returns 0 if no valid score or F tier
     */
    function getRiskBasedDiscount(address business) external view returns (uint16 discountBps) {
        CreditScore storage cs = creditScores[business];

        // No valid score = no discount
        if (!cs.valid || block.timestamp > cs.expiresAt) {
            return 0;
        }

        // Discount based on risk tier
        if (cs.riskTier == RiskTier.A) return 1500;  // 15% discount
        if (cs.riskTier == RiskTier.B) return 1000;  // 10% discount
        if (cs.riskTier == RiskTier.C) return 500;   // 5% discount
        if (cs.riskTier == RiskTier.D) return 250;   // 2.5% discount
        return 0;  // F tier = no discount
    }

    /**
     * @notice Get full credit score details
     * @param business Address to query
     */
    function getCreditScoreDetails(address business) external view returns (
        CreditScore memory
    ) {
        return creditScores[business];
    }

    /**
     * @notice Get request details
     * @param requestId Request to query
     */
    function getRequestDetails(bytes32 requestId) external view returns (
        CreditRequest memory
    ) {
        return creditRequests[requestId];
    }

    /**
     * @notice Check if business has pending request
     * @param business Address to check
     */
    function hasPendingRequest(address business) external view returns (
        bool pending,
        bytes32 requestId
    ) {
        requestId = pendingRequests[business];
        if (requestId == bytes32(0)) return (false, bytes32(0));

        CreditRequest storage request = creditRequests[requestId];
        pending = request.status == RequestStatus.Pending &&
                  block.timestamp <= request.expiresAt;

        return (pending, requestId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update iExec proxy address
     */
    function setIexecProxy(address _iexecProxy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_iexecProxy == address(0)) revert InvalidAddress();

        // Revoke old proxy role
        _revokeRole(IEXEC_CALLBACK_ROLE, iexecProxy);

        // Set new proxy
        iexecProxy = _iexecProxy;
        _grantRole(IEXEC_CALLBACK_ROLE, _iexecProxy);
    }

    /**
     * @notice Set authorized iApp hash for verification
     */
    function setAuthorizedApp(bytes32 _appHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedAppHash = _appHash;
    }

    /**
     * @notice Update request timeout
     */
    function setRequestTimeout(uint256 _timeout) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_timeout >= 10 minutes && _timeout <= 24 hours, "Invalid timeout");
        requestTimeout = _timeout;
        emit ConfigUpdated("requestTimeout", _timeout);
    }

    /**
     * @notice Update score validity period
     */
    function setScoreValidityPeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_period >= 1 days && _period <= 365 days, "Invalid period");
        scoreValidityPeriod = _period;
        emit ConfigUpdated("scoreValidityPeriod", _period);
    }

    /**
     * @notice Update minimum confidence threshold
     */
    function setMinConfidenceThreshold(uint256 _threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_threshold <= 10000, "Invalid threshold");
        minConfidenceThreshold = _threshold;
        emit ConfigUpdated("minConfidenceThreshold", _threshold);
    }

    /**
     * @notice Invalidate a business's credit score (emergency)
     */
    function invalidateCreditScore(address business) external onlyRole(OPERATOR_ROLE) {
        creditScores[business].valid = false;
        emit CreditScoreExpired(business);
    }

    /**
     * @notice Manually expire old requests (cleanup)
     */
    function expireRequest(bytes32 requestId) external {
        CreditRequest storage request = creditRequests[requestId];

        if (request.status == RequestStatus.Pending &&
            block.timestamp > request.expiresAt) {
            request.status = RequestStatus.Expired;
            delete pendingRequests[request.business];
        }
    }
}
