// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ZKKYCVerifier
 * @notice Zero-Knowledge KYC verification for ServiceFi
 * @dev Users prove KYC compliance without revealing personal information
 *
 * Privacy Features:
 * - Prove age >= 18 without revealing exact age
 * - Prove non-sanctioned jurisdiction without revealing country
 * - Prove identity verification without exposing PII
 * - One-time verification per wallet (using nullifiers)
 *
 * Integration with Polygon ID / iden3 protocol
 */
contract ZKKYCVerifier {

    // ============ State Variables ============

    /// @notice Owner address (can update verifier addresses)
    address public owner;

    /// @notice Mapping of verified users
    mapping(address => KYCStatus) public kycStatus;

    /// @notice Nullifier tracking (prevents double-verification with same credential)
    mapping(uint256 => bool) public usedNullifiers;

    /// @notice Trusted KYC providers
    mapping(address => bool) public trustedProviders;

    /// @notice KYC verification levels
    enum VerificationLevel {
        None,           // Not verified
        Basic,          // Basic KYC (age, country)
        Enhanced,       // Enhanced KYC (income verification)
        Institutional   // Institutional (accredited investor)
    }

    struct KYCStatus {
        VerificationLevel level;
        uint256 verifiedAt;
        uint256 expiresAt;
        bool isActive;
        bytes32 credentialHash; // Commitment to credential data
    }

    // ============ Events ============

    event KYCVerified(
        address indexed user,
        VerificationLevel level,
        uint256 timestamp,
        uint256 expiresAt
    );

    event KYCRevoked(
        address indexed user,
        uint256 timestamp
    );

    event TrustedProviderAdded(address indexed provider);
    event TrustedProviderRemoved(address indexed provider);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyTrustedProvider() {
        require(trustedProviders[msg.sender], "Not trusted provider");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @notice Submit ZK proof of KYC compliance
     * @dev Verifies proof without revealing personal information
     * @param proof ZK proof array (Groth16 format: [pi_a, pi_b, pi_c])
     * @param pubSignals Public signals [nullifier, level, expiryTimestamp]
     * @param credentialHash Commitment to credential data
     */
    function submitKYCProof(
        uint256[8] calldata proof, // Groth16 proof format
        uint256[3] calldata pubSignals,
        bytes32 credentialHash
    ) external {
        // Extract public signals
        uint256 nullifier = pubSignals[0];
        VerificationLevel level = VerificationLevel(pubSignals[1]);
        uint256 expiryTimestamp = pubSignals[2];

        // Verify proof hasn't been used before (prevents double-verification)
        require(!usedNullifiers[nullifier], "Credential already used");

        // Verify expiry is in future
        require(expiryTimestamp > block.timestamp, "Credential expired");

        // Verify the ZK proof
        require(
            verifyProof(proof, pubSignals),
            "Invalid KYC proof"
        );

        // Mark nullifier as used
        usedNullifiers[nullifier] = true;

        // Update KYC status
        kycStatus[msg.sender] = KYCStatus({
            level: level,
            verifiedAt: block.timestamp,
            expiresAt: expiryTimestamp,
            isActive: true,
            credentialHash: credentialHash
        });

        emit KYCVerified(msg.sender, level, block.timestamp, expiryTimestamp);
    }

    /**
     * @notice Verify ZK proof using Groth16 verifier
     * @dev This would integrate with actual verifier contract in production
     * @param proof Proof array
     * @param pubSignals Public signals
     * @return valid True if proof is valid
     */
    function verifyProof(
        uint256[8] calldata proof,
        uint256[3] calldata pubSignals
    ) public view returns (bool valid) {
        // In production, this would call a generated Groth16 verifier contract
        // For now, return true for demonstration
        // TODO: Replace with actual verifier deployment

        // Example verification checks:
        // 1. Proof elements are in field range
        // 2. Public signals match expected format
        // 3. Pairing check passes

        // Placeholder validation
        require(proof.length == 8, "Invalid proof length");
        require(pubSignals.length == 3, "Invalid public signals length");
        require(pubSignals[1] <= uint256(VerificationLevel.Institutional), "Invalid level");

        return true; // Replace with actual verification
    }

    /**
     * @notice Check if user has valid KYC
     * @param user Address to check
     * @return isValid True if KYC is valid and not expired
     */
    function isKYCValid(address user) public view returns (bool isValid) {
        KYCStatus memory status = kycStatus[user];
        return status.isActive &&
               status.level != VerificationLevel.None &&
               status.expiresAt > block.timestamp;
    }

    /**
     * @notice Check if user has minimum KYC level
     * @param user Address to check
     * @param minLevel Minimum required level
     * @return hasLevel True if user meets minimum level
     */
    function hasMinimumLevel(
        address user,
        VerificationLevel minLevel
    ) public view returns (bool hasLevel) {
        KYCStatus memory status = kycStatus[user];
        return isKYCValid(user) && status.level >= minLevel;
    }

    /**
     * @notice Require valid KYC for function execution
     * @param user Address to check
     */
    function requireKYC(address user) public view {
        require(isKYCValid(user), "Valid KYC required");
    }

    /**
     * @notice Require minimum KYC level for function execution
     * @param user Address to check
     * @param minLevel Minimum required level
     */
    function requireMinimumLevel(
        address user,
        VerificationLevel minLevel
    ) public view {
        require(
            hasMinimumLevel(user, minLevel),
            "Insufficient KYC level"
        );
    }

    /**
     * @notice Revoke KYC for a user
     * @dev Only callable by trusted providers or user themselves
     * @param user Address to revoke
     */
    function revokeKYC(address user) external {
        require(
            msg.sender == user || trustedProviders[msg.sender] || msg.sender == owner,
            "Unauthorized"
        );

        kycStatus[user].isActive = false;

        emit KYCRevoked(user, block.timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add trusted KYC provider
     * @param provider Address of provider
     */
    function addTrustedProvider(address provider) external onlyOwner {
        trustedProviders[provider] = true;
        emit TrustedProviderAdded(provider);
    }

    /**
     * @notice Remove trusted KYC provider
     * @param provider Address of provider
     */
    function removeTrustedProvider(address provider) external onlyOwner {
        trustedProviders[provider] = false;
        emit TrustedProviderRemoved(provider);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // ============ View Functions ============

    /**
     * @notice Get KYC status for user
     * @param user Address to query
     * @return level Verification level
     * @return verifiedAt Timestamp of verification
     * @return expiresAt Expiry timestamp
     * @return isActive Active status
     */
    function getKYCStatus(address user) external view returns (
        VerificationLevel level,
        uint256 verifiedAt,
        uint256 expiresAt,
        bool isActive
    ) {
        KYCStatus memory status = kycStatus[user];
        return (
            status.level,
            status.verifiedAt,
            status.expiresAt,
            status.isActive
        );
    }

    /**
     * @notice Get time until KYC expiry
     * @param user Address to query
     * @return timeLeft Seconds until expiry (0 if expired)
     */
    function getTimeUntilExpiry(address user) external view returns (uint256 timeLeft) {
        KYCStatus memory status = kycStatus[user];
        if (!status.isActive || status.expiresAt <= block.timestamp) {
            return 0;
        }
        return status.expiresAt - block.timestamp;
    }
}
