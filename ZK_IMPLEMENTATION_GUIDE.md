# ServiceFi ZK & Privacy Implementation Guide

## Quick Start: Adding Privacy to ServiceFi

This guide provides practical steps to integrate Zero-Knowledge proofs and privacy features into ServiceFi.

---

## Phase 1: ZK-KYC Integration (Week 1-2)

### Step 1: Install Polygon ID SDK

```bash
# In frontend directory
cd frontend
npm install @0xpolygonid/js-sdk

# In contracts directory
cd ../contracts
npm install @iden3/contracts
```

### Step 2: Deploy ZK-KYC Verifier

```bash
# Compile ZKKYCVerifier contract
npx hardhat compile

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy-zkkyc.ts --network mantleSepoliaTestnet
```

**deploy-zkkyc.ts**:
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ZKKYCVerifier...");

  const ZKKYCVerifier = await ethers.getContractFactory("ZKKYCVerifier");
  const verifier = await ZKKYCVerifier.deploy();
  await verifier.waitForDeployment();

  const address = await verifier.getAddress();
  console.log("ZKKYCVerifier deployed to:", address);

  // Add trusted KYC providers
  const providers = [
    "0x...", // Polygon ID issuer
    "0x...", // Synaps
    "0x...", // Fractal
  ];

  for (const provider of providers) {
    await verifier.addTrustedProvider(provider);
    console.log("Added trusted provider:", provider);
  }
}

main().catch(console.error);
```

### Step 3: Create KYC UI Component

**frontend/components/zk-kyc-modal.tsx**:
```typescript
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ZKKYCVerifierABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

export function ZKKYCModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const handlePolygonIDVerification = async () => {
    setIsVerifying(true);

    try {
      // 1. Initialize Polygon ID wallet
      const { W3CCredential } = await import('@0xpolygonid/js-sdk');

      // 2. Request KYC credential from issuer
      const credentialRequest = {
        type: 'KYCAgeCredential',
        requiredFields: ['birthdate'],
        constraints: {
          age: { min: 18 }
        }
      };

      // 3. Generate ZK proof
      const proof = await generateKYCProof(credentialRequest);

      // 4. Submit proof to smart contract
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.mantleSepoliaTestnet.zkKYCVerifier,
        abi: ZKKYCVerifierABI,
        functionName: 'submitKYCProof',
        args: [
          proof.groth16Proof,
          proof.publicSignals,
          proof.credentialHash
        ],
      });

      console.log('KYC verification successful!');
      onClose();
    } catch (error) {
      console.error('KYC verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Privacy-Preserving KYC</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify your identity without revealing personal information.
            We'll only know you meet these requirements:
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckIcon />
              Age 18 or older
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Not from sanctioned country
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Identity verified by trusted provider
            </li>
          </ul>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">What we DON'T see:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your exact age</li>
              <li>• Your name or address</li>
              <li>• Your country of residence</li>
              <li>• Any personal documents</li>
            </ul>
          </div>

          <Button
            onClick={handlePolygonIDVerification}
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? 'Verifying...' : 'Verify with Polygon ID'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Powered by Zero-Knowledge cryptography
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
```

### Step 4: Integrate KYC Gates

Update ServiceCreditToken to require KYC for business registration:

```solidity
// In ServiceCreditToken.sol

import "./ZKKYCVerifier.sol";

contract ServiceCreditToken is ERC1155, ReentrancyGuard, Ownable {
    // ... existing code ...

    ZKKYCVerifier public kycVerifier;

    constructor(
        string memory uri_,
        address feeCollector_,
        address redemptionOracle_,
        address kycVerifier_  // NEW
    ) ERC1155(uri_) Ownable(msg.sender) {
        // ... existing code ...
        kycVerifier = ZKKYCVerifier(kycVerifier_);
    }

    function registerProvider() external {
        // Require KYC for business registration
        kycVerifier.requireMinimumLevel(
            msg.sender,
            ZKKYCVerifier.VerificationLevel.Basic
        );

        providers[msg.sender] = true;
        emit ProviderRegistered(msg.sender);
    }
}
```

---

## Phase 2: Private Transactions with Aztec (Week 3-4)

### Step 1: Install Aztec SDK

```bash
npm install @aztec/aztec.js @aztec/circuits.js
```

### Step 2: Deploy Aztec Bridge

```solidity
// contracts/PrivateServiceBridge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ServiceCreditToken.sol";

contract PrivateServiceBridge {
    ServiceCreditToken public serviceCreditToken;

    mapping(bytes32 => bool) public usedNotes;
    mapping(address => bytes32[]) public userNotes;

    event PrivatePurchase(bytes32 indexed noteCommitment, uint256 tokenId);
    event PrivateRedeem(bytes32 indexed noteNullifier, uint256 tokenId);

    constructor(address _serviceCreditToken) {
        serviceCreditToken = ServiceCreditToken(_serviceCreditToken);
    }

    /**
     * @notice Purchase service tokens privately
     * @dev User deposits MNT, receives encrypted note
     */
    function privatePurchase(
        uint256 tokenId,
        uint256 amount,
        bytes32 noteCommitment,
        uint256[8] calldata proof
    ) external payable {
        // Verify ZK proof that commitment is well-formed
        require(verifyCommitmentProof(proof, noteCommitment), "Invalid proof");

        // Purchase tokens
        uint256 totalCost = serviceCreditToken.services(tokenId).price * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        serviceCreditToken.mintCredit{value: totalCost}(tokenId, amount);

        // Transfer tokens to bridge (will be held until redemption)
        serviceCreditToken.safeTransferFrom(
            address(this),
            address(this),
            tokenId,
            amount,
            ""
        );

        // Store note commitment
        userNotes[msg.sender].push(noteCommitment);

        emit PrivatePurchase(noteCommitment, tokenId);
    }

    /**
     * @notice Redeem service tokens privately
     * @dev User proves ownership of note without revealing amount
     */
    function privateRedeem(
        uint256 tokenId,
        bytes32 noteNullifier,
        uint256[8] calldata proof,
        uint256[3] calldata pubSignals
    ) external {
        // Verify note hasn't been spent
        require(!usedNotes[noteNullifier], "Note already spent");

        // Verify ZK proof of note ownership
        require(verifyRedemptionProof(proof, pubSignals), "Invalid proof");

        // Mark note as spent
        usedNotes[noteNullifier] = true;

        // Extract amount from public signals
        uint256 amount = pubSignals[2];

        // Transfer tokens to user for redemption
        serviceCreditToken.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amount,
            ""
        );

        emit PrivateRedeem(noteNullifier, tokenId);
    }

    function verifyCommitmentProof(
        uint256[8] calldata proof,
        bytes32 commitment
    ) internal pure returns (bool) {
        // Verify proof that commitment = hash(amount, randomness, owner)
        // TODO: Implement Groth16 verification
        return true;
    }

    function verifyRedemptionProof(
        uint256[8] calldata proof,
        uint256[3] calldata pubSignals
    ) internal pure returns (bool) {
        // Verify proof that:
        // - User knows preimage of commitment
        // - Nullifier = hash(commitment, secret)
        // TODO: Implement Groth16 verification
        return true;
    }
}
```

### Step 3: Create Private Purchase UI

```typescript
// frontend/components/private-purchase-modal.tsx

import { useState } from 'react';
import { generateRandomness, computeNoteCommitment } from '@aztec/circuits.js';

export function PrivatePurchaseModal({ tokenId, price }: { tokenId: bigint; price: bigint }) {
  const [amount, setAmount] = useState('1');

  const handlePrivatePurchase = async () => {
    // Generate random blinding factor
    const randomness = generateRandomness();

    // Compute note commitment
    const commitment = computeNoteCommitment({
      tokenId,
      amount: BigInt(amount),
      owner: address,
      randomness,
    });

    // Generate ZK proof of correct commitment
    const proof = await generateCommitmentProof({
      tokenId,
      amount: BigInt(amount),
      randomness,
    });

    // Submit private purchase
    await privateBridge.privatePurchase(
      tokenId,
      BigInt(amount),
      commitment,
      proof
    );

    // Store note locally (encrypted)
    saveEncryptedNote({
      commitment,
      tokenId,
      amount: BigInt(amount),
      randomness,
    });
  };

  return (
    <Dialog>
      <DialogContent>
        <h2>Private Purchase</h2>
        <p>Your purchase amount will be hidden from everyone</p>

        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />

        <Button onClick={handlePrivatePurchase}>
          Purchase Privately
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>✓ Amount encrypted on-chain</p>
          <p>✓ Only you can see your balance</p>
          <p>✓ Trades remain private until redemption</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 3: Business Credential Proofs (Week 5-6)

### Circom Circuit for Revenue Threshold

**circuits/revenue_threshold.circom**:
```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template RevenueThreshold() {
    // Private inputs (only business knows)
    signal input monthlyRevenue;  // Actual revenue
    signal input nonce;            // Privacy salt

    // Public inputs
    signal input threshold;        // Minimum revenue to prove
    signal input businessAddress;  // Business public address

    // Output
    signal output valid;

    // Check revenue >= threshold
    component gte = GreaterEqThan(64);
    gte.in[0] <== monthlyRevenue;
    gte.in[1] <== threshold;

    // Check revenue is reasonable (< $100M to prevent fake proofs)
    component lte = LessEqThan(64);
    lte.in[0] <== monthlyRevenue;
    lte.in[1] <== 100000000;

    // Both constraints must pass
    signal isAboveThreshold;
    signal isBelowMax;
    isAboveThreshold <== gte.out;
    isBelowMax <== lte.out;

    valid <== isAboveThreshold * isBelowMax;
}

component main {public [threshold, businessAddress]} = RevenueThreshold();
```

### Compile Circuit

```bash
# Install circom compiler
npm install -g circom

# Compile circuit
circom revenue_threshold.circom --r1cs --wasm --sym

# Generate proving/verification keys
snarkjs groth16 setup revenue_threshold.r1cs pot12_final.ptau circuit_0000.zkey

# Export verification key
snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier circuit_0000.zkey RevenueThresholdVerifier.sol
```

### Business Proof UI

```typescript
// frontend/components/business-credential-proof.tsx

export function BusinessCredentialProof({ businessAddress }: { businessAddress: string }) {
  const [monthlyRevenue, setMonthlyRevenue] = useState('');

  const handleGenerateProof = async () => {
    // Generate ZK proof that revenue >= $10,000
    const threshold = 10000;

    const input = {
      monthlyRevenue: Number(monthlyRevenue),
      nonce: generateRandomNonce(),
      threshold,
      businessAddress,
    };

    // Generate witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      'revenue_threshold.wasm',
      'circuit_0000.zkey'
    );

    // Submit proof on-chain
    await businessVerifier.submitBusinessProof(
      formatProofForSolidity(proof),
      publicSignals,
      ethers.utils.formatBytes32String('REVENUE_THRESHOLD')
    );

    console.log('Proof submitted! You can now show "Revenue > $10K ✓" badge');
  };

  return (
    <Card>
      <h3>Prove Your Creditworthiness</h3>
      <p>Show investors you meet revenue thresholds without revealing exact numbers</p>

      <Input
        type="number"
        value={monthlyRevenue}
        onChange={(e) => setMonthlyRevenue(e.target.value)}
        placeholder="Monthly Revenue (private)"
      />

      <Button onClick={handleGenerateProof}>
        Generate Proof (Revenue ≥ $10K)
      </Button>

      <div className="text-xs">
        Investors will see: "Revenue threshold verified ✓"
        <br/>
        Investors will NOT see: Your exact revenue amount
      </div>
    </Card>
  );
}
```

---

## Integration Checklist

### Contracts
- [x] ZKKYCVerifier.sol deployed
- [ ] PrivateServiceBridge.sol deployed
- [ ] BusinessCredentialVerifier.sol deployed
- [ ] RevenueThresholdVerifier.sol generated and deployed
- [ ] Update ServiceCreditToken with KYC gates

### Frontend
- [ ] ZK-KYC modal component
- [ ] Private purchase flow
- [ ] Business proof generator
- [ ] Privacy settings page

### Infrastructure
- [ ] Polygon ID issuer node setup
- [ ] IPFS for encrypted note storage
- [ ] Circom compilation pipeline
- [ ] Proof generation server (for heavy circuits)

### Testing
- [ ] Unit tests for ZK verifiers
- [ ] Integration tests for private flows
- [ ] Proof generation performance tests
- [ ] Gas cost analysis

---

## Cost Analysis

### Proof Generation Costs
| Proof Type | Generation Time | Gas Cost | User Experience |
|------------|----------------|----------|-----------------|
| ZK-KYC | 5-10s | 250K gas | One-time setup |
| Private Purchase | 2-5s | 150K gas | Per transaction |
| Revenue Proof | 10-20s | 400K gas | Monthly update |
| Yield Proof | 15-30s | 450K gas | Quarterly |

### Optimization Strategies
1. **Proof Batching**: Combine multiple proofs into one
2. **Recursive SNARKs**: Prove proofs for constant size
3. **Mantle L2**: ~10x cheaper gas than Ethereum mainnet
4. **Client-side Generation**: Offload to user's browser

---

## Security Audits Required

1. **Circuit Audits**
   - Under-constrained circuits
   - Arithmetic overflow vulnerabilities
   - Formal verification

2. **Smart Contract Audits**
   - Proof verification logic
   - Nullifier management
   - Access control

3. **Cryptographic Review**
   - Trusted setup validation
   - Randomness generation
   - Key management

---

## Next Steps

1. **Week 1**: Deploy ZKKYCVerifier, integrate Polygon ID
2. **Week 2**: Build KYC UI, test with testnet
3. **Week 3**: Design Aztec bridge architecture
4. **Week 4**: Implement private purchase flow
5. **Week 5**: Create revenue threshold circuit
6. **Week 6**: Launch beta with privacy features

**Ready to start?** Begin with ZK-KYC deployment:
```bash
cd contracts
npx hardhat run scripts/deploy-zkkyc.ts --network mantleSepoliaTestnet
```
