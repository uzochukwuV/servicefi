# iExec TEE Integration Analysis for ServiceFi

## Executive Summary

ServiceFi can leverage iExec's Trusted Execution Environment (TEE) to add **confidential computing** for sensitive operations that currently expose business data on-chain. This analysis identifies **4 high-value integration opportunities** for the Hack4Privacy hackathon.

---

## Current Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT SERVICEFI STACK                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   ZK-KYC     │    │   Reclaim    │    │  Redemption  │      │
│  │  Verifier    │    │   zkTLS      │    │   Oracle     │      │
│  │  (Identity)  │    │  (Metrics)   │    │  (Service)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ServiceCreditToken (ERC1155)                │    │
│  │                    + LiquidityPool                       │    │
│  │                    + Marketplace                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  PRIVACY GAPS:                                                   │
│  ❌ Credit scores computed off-chain, no verifiable privacy     │
│  ❌ Invoice amounts visible to verifiers                        │
│  ❌ LP positions exposed to service providers                   │
│  ❌ Customer purchase patterns traceable on-chain               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## iExec TEE Integration Opportunities

### 1. Confidential Credit Scoring Engine

**Problem**: Businesses need credit scores for undercollateralized lending, but exposing financial data (revenue, bank balances, receivables) on-chain destroys competitive advantage.

**Solution**: Compute credit scores inside TEE using encrypted financial data.

```
┌─────────────────────────────────────────────────────────────────┐
│              CONFIDENTIAL CREDIT SCORING FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Business Owner                     iExec TEE (SGX/TDX)         │
│       │                                    │                     │
│       │  1. Encrypt financial data         │                     │
│       │     - Stripe revenue history       │                     │
│       │     - Bank account balances        │                     │
│       │     - Outstanding invoices         │                     │
│       │     - Payment history              │                     │
│       │                                    │                     │
│       ├──────────────────────────────────►│                     │
│       │    encrypted_data + dataset_hash   │                     │
│       │                                    │                     │
│       │                            ┌───────┴───────┐             │
│       │                            │  TEE Enclave  │             │
│       │                            │               │             │
│       │                            │ 1. Decrypt    │             │
│       │                            │ 2. Validate   │             │
│       │                            │ 3. Compute    │             │
│       │                            │    score      │             │
│       │                            │ 4. Sign       │             │
│       │                            │    result     │             │
│       │                            └───────┬───────┘             │
│       │                                    │                     │
│       │◄───────────────────────────────────┤                     │
│       │   credit_score (0-1000)            │                     │
│       │   risk_tier (A/B/C/D)              │                     │
│       │   max_credit_line                   │                     │
│       │   TEE_attestation                  │                     │
│       │                                    │                     │
│       │  (Raw data NEVER leaves TEE)       │                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**On-Chain Output** (only this is stored):
```solidity
struct CreditScore {
    address business;
    uint16 score;           // 0-1000
    uint8 riskTier;         // 0=A, 1=B, 2=C, 3=D
    uint256 maxCreditLine;  // In wei
    uint64 computedAt;
    bytes32 attestationHash; // TEE proof
}
```

**What stays private**:
- Actual revenue numbers
- Bank account balances
- Customer payment history
- Outstanding receivables
- Profit margins

---

### 2. Private Invoice/Receivables Processing

**Problem**: Invoices contain sensitive data (customer names, amounts, payment terms) that shouldn't be exposed when tokenizing receivables.

**Solution**: Process invoice bundles in TEE, output only aggregate metrics.

```
┌─────────────────────────────────────────────────────────────────┐
│              PRIVATE INVOICE PROCESSING FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Invoice Bundle (Encrypted)          TEE Processing              │
│  ┌─────────────────────────┐        ┌─────────────────────────┐ │
│  │ Invoice #1              │        │                         │ │
│  │ - Customer: ENCRYPTED   │───────►│  1. Decrypt invoices    │ │
│  │ - Amount: ENCRYPTED     │        │  2. Validate formats    │ │
│  │ - Due Date: ENCRYPTED   │        │  3. Check duplicates    │ │
│  │ - Status: ENCRYPTED     │        │  4. Compute metrics:    │ │
│  ├─────────────────────────┤        │     - Total value       │ │
│  │ Invoice #2              │        │     - Avg days to pay   │ │
│  │ - Customer: ENCRYPTED   │        │     - Default rate      │ │
│  │ - Amount: ENCRYPTED     │        │     - Concentration     │ │
│  │ - ...                   │        │  5. Sign attestation    │ │
│  ├─────────────────────────┤        │                         │ │
│  │ Invoice #N              │        └───────────┬─────────────┘ │
│  │ - ...                   │                    │               │
│  └─────────────────────────┘                    ▼               │
│                                     ┌─────────────────────────┐ │
│                                     │ On-Chain Output:        │ │
│                                     │ - bundleValue: 50000    │ │
│                                     │ - invoiceCount: 47      │ │
│                                     │ - avgDaysOutstanding: 23│ │
│                                     │ - riskScore: 720        │ │
│                                     │ - attestation: 0xabc... │ │
│                                     └─────────────────────────┘ │
│                                                                  │
│  PRIVACY PRESERVED:                                             │
│  ✅ Individual invoice amounts hidden                           │
│  ✅ Customer identities protected                               │
│  ✅ Payment terms confidential                                  │
│  ✅ Concentration risk computed but not exposed                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Confidential LP Position Aggregation

**Problem**: LP positions are visible on-chain, exposing investment strategies to service providers who might discriminate based on investor size.

**Solution**: TEE computes yield distributions without revealing individual positions.

```
┌─────────────────────────────────────────────────────────────────┐
│              CONFIDENTIAL YIELD DISTRIBUTION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LP Positions (Private)              TEE Computation             │
│  ┌─────────────────────┐            ┌─────────────────────────┐ │
│  │ LP1: 10,000 USDC    │            │                         │ │
│  │ LP2: 50,000 USDC    │───────────►│ 1. Sum positions        │ │
│  │ LP3: 5,000 USDC     │            │ 2. Calculate pro-rata   │ │
│  │ LP4: 100,000 USDC   │            │ 3. Apply yield rates    │ │
│  │ ...                 │            │ 4. Generate claims      │ │
│  └─────────────────────┘            │    (encrypted per LP)   │ │
│                                     │ 5. Merkle root output   │ │
│                                     └───────────┬─────────────┘ │
│                                                 │               │
│                                                 ▼               │
│                                     ┌─────────────────────────┐ │
│                                     │ On-Chain:               │ │
│                                     │ - merkleRoot: 0x123...  │ │
│                                     │ - totalYield: 8,250     │ │
│                                     │ - epoch: 42             │ │
│                                     └─────────────────────────┘ │
│                                                                  │
│  Each LP claims with encrypted proof from TEE                   │
│  Service provider sees: "Pool distributed 8,250 to N LPs"       │
│  Service provider CANNOT see: individual LP amounts             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Private Service Redemption Verification

**Problem**: Current RedemptionOracle exposes redemption patterns (who, when, how much) enabling customer profiling.

**Solution**: TEE verifies redemptions and outputs only aggregate stats.

```
┌─────────────────────────────────────────────────────────────────┐
│           PRIVATE REDEMPTION VERIFICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer Request (Encrypted)                                    │
│  ┌─────────────────────────┐                                    │
│  │ tokenId: 42             │                                    │
│  │ amount: 3               │       ┌─────────────────────────┐  │
│  │ proofData: {            │──────►│        iExec TEE        │  │
│  │   qrCode: "...",        │       │                         │  │
│  │   location: "...",      │       │ 1. Verify QR valid      │  │
│  │   timestamp: "...",     │       │ 2. Check not replayed   │  │
│  │   receiptHash: "..."    │       │ 3. Validate location    │  │
│  │ }                       │       │ 4. Confirm service type │  │
│  └─────────────────────────┘       │ 5. Output: approved/not │  │
│                                    └───────────┬─────────────┘  │
│                                                │                │
│                                                ▼                │
│                                    ┌─────────────────────────┐  │
│                                    │ On-Chain Output:        │  │
│                                    │ - approved: true        │  │
│                                    │ - confidenceScore: 9500 │  │
│                                    │ - attestation: 0xdef... │  │
│                                    │                         │  │
│                                    │ NOT stored:             │  │
│                                    │ - location details      │  │
│                                    │ - exact timestamp       │  │
│                                    │ - customer behavior     │  │
│                                    └─────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### iApp Architecture (iExec Application)

```
servicefi-confidential-iapp/
├── src/
│   ├── app.js                    # Main iApp entry point
│   ├── credit-scoring/
│   │   ├── score-calculator.js   # Credit score algorithm
│   │   ├── risk-model.js         # Risk tier classification
│   │   └── validators.js         # Input validation
│   ├── invoice-processing/
│   │   ├── parser.js             # Invoice format parser
│   │   ├── aggregator.js         # Bundle metrics
│   │   └── fraud-detection.js    # Duplicate/fraud checks
│   ├── yield-distribution/
│   │   ├── calculator.js         # Pro-rata yield
│   │   └── merkle-generator.js   # Claim tree
│   └── utils/
│       ├── encryption.js         # Data decryption in TEE
│       └── attestation.js        # TEE proof generation
├── Dockerfile                    # SGX/TDX compatible image
├── sconify.sh                    # TEE enclave conversion
└── iexec.json                    # iExec configuration
```

### Sample iApp Code (Credit Scoring)

```javascript
// src/credit-scoring/score-calculator.js
const { IExecDataProtector } = require('@iexec/dataprotector');

async function computeCreditScore(encryptedData, datasetAddress) {
  // 1. Decrypt data inside TEE (only TEE has the key)
  const financialData = await decryptDataset(encryptedData, datasetAddress);

  // 2. Validate data structure
  validateFinancialData(financialData);

  // 3. Compute credit score (proprietary algorithm runs privately)
  const score = calculateScore({
    monthlyRevenue: financialData.stripe.monthlyRevenue,
    revenueGrowth: financialData.stripe.growthRate,
    bankBalance: financialData.bank.currentBalance,
    avgReceivablesDays: financialData.invoices.avgDaysOutstanding,
    paymentHistory: financialData.payments.onTimeRate,
    businessAge: financialData.registration.yearsInBusiness
  });

  // 4. Determine risk tier
  const riskTier = classifyRiskTier(score);

  // 5. Calculate max credit line
  const maxCreditLine = computeCreditLine(score, financialData.monthlyRevenue);

  // 6. Return ONLY aggregated results (raw data never leaves TEE)
  return {
    score: Math.round(score),           // 0-1000
    riskTier: riskTier,                 // A/B/C/D
    maxCreditLine: maxCreditLine,       // In USDC
    computedAt: Date.now(),
    attestation: generateAttestation()  // TEE proof
  };
}

function calculateScore({ monthlyRevenue, revenueGrowth, bankBalance,
                          avgReceivablesDays, paymentHistory, businessAge }) {
  let score = 500; // Base score

  // Revenue stability (0-200 points)
  if (monthlyRevenue > 100000) score += 200;
  else if (monthlyRevenue > 50000) score += 150;
  else if (monthlyRevenue > 20000) score += 100;
  else if (monthlyRevenue > 10000) score += 50;

  // Growth trajectory (0-150 points)
  if (revenueGrowth > 0.20) score += 150;
  else if (revenueGrowth > 0.10) score += 100;
  else if (revenueGrowth > 0) score += 50;
  else score -= 50;

  // Liquidity buffer (0-100 points)
  const monthsRunway = bankBalance / monthlyRevenue;
  if (monthsRunway > 6) score += 100;
  else if (monthsRunway > 3) score += 75;
  else if (monthsRunway > 1) score += 25;

  // Receivables efficiency (0-50 points)
  if (avgReceivablesDays < 30) score += 50;
  else if (avgReceivablesDays < 45) score += 25;
  else if (avgReceivablesDays > 60) score -= 25;

  return Math.max(0, Math.min(1000, score));
}
```

### Smart Contract Integration

```solidity
// contracts/ConfidentialCreditOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@iexec/poco/contracts/IexecInterfaceToken.sol";

contract ConfidentialCreditOracle {
    IexecInterfaceToken public iexec;

    struct CreditResult {
        uint16 score;
        uint8 riskTier;
        uint256 maxCreditLine;
        uint64 computedAt;
        uint64 expiresAt;
        bytes32 attestationHash;
    }

    mapping(address => CreditResult) public creditScores;
    mapping(bytes32 => address) public pendingTasks; // taskId => business

    event CreditScoreRequested(address indexed business, bytes32 taskId);
    event CreditScoreUpdated(address indexed business, uint16 score, uint8 riskTier);

    // Business requests credit score computation
    function requestCreditScore(
        bytes32 encryptedDatasetHash,
        address iexecApp,
        address iexecWorkerpool
    ) external payable returns (bytes32 taskId) {
        // Create iExec task with encrypted dataset
        taskId = iexec.matchOrdersBoost(
            _buildAppOrder(iexecApp),
            _buildDatasetOrder(encryptedDatasetHash),
            _buildWorkerpoolOrder(iexecWorkerpool),
            _buildRequestOrder(msg.sender)
        );

        pendingTasks[taskId] = msg.sender;
        emit CreditScoreRequested(msg.sender, taskId);
    }

    // Callback from iExec with TEE result
    function receiveCreditScore(
        bytes32 taskId,
        uint16 score,
        uint8 riskTier,
        uint256 maxCreditLine,
        bytes32 attestationHash
    ) external {
        require(msg.sender == address(iexec), "Only iExec");

        address business = pendingTasks[taskId];
        require(business != address(0), "Unknown task");

        creditScores[business] = CreditResult({
            score: score,
            riskTier: riskTier,
            maxCreditLine: maxCreditLine,
            computedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + 30 days),
            attestationHash: attestationHash
        });

        delete pendingTasks[taskId];
        emit CreditScoreUpdated(business, score, riskTier);
    }

    // LiquidityPool calls this to check creditworthiness
    function getCreditScore(address business) external view returns (
        uint16 score,
        uint8 riskTier,
        uint256 maxCreditLine,
        bool valid
    ) {
        CreditResult memory result = creditScores[business];
        valid = result.computedAt > 0 && block.timestamp < result.expiresAt;
        return (result.score, result.riskTier, result.maxCreditLine, valid);
    }
}
```

---

## Hackathon Submission Strategy

### Recommended Focus: **Confidential Credit Scoring**

**Why this track wins:**
1. **Directly addresses RWA track** - Credit scores for real-world service businesses
2. **Clear value proposition** - Enables undercollateralized lending without exposing business secrets
3. **Demonstrates full TEE flow** - Encrypted input → private computation → verifiable output
4. **Composable** - LiquidityPool can integrate for risk-based pricing

### Implementation Timeline (Hackathon)

| Phase | Deliverable | Priority |
|-------|-------------|----------|
| Day 1-2 | iApp scaffold + basic TEE enclave | Must have |
| Day 3-4 | Credit scoring algorithm in TEE | Must have |
| Day 5 | Smart contract integration | Must have |
| Day 6 | Frontend: Score request + display | Must have |
| Day 7 | Demo video + polish | Must have |
| Bonus | Bulk processing for multiple businesses | Nice to have |

### Deployment Checklist

- [ ] Deploy on **Arbitrum Sepolia** (hackathon requirement)
- [ ] Use iExec Bellecour testnet for TEE tasks
- [ ] Functional frontend showing score request flow
- [ ] Demo video (2-3 minutes)
- [ ] `feedback.md` about iExec tools
- [ ] GitHub repo with MIT license

---

## Architecture Diagram: Full Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVICEFI + iEXEC TEE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND (Next.js)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  Business   │  │  Customer   │  │  Investor   │              │   │
│  │  │  Dashboard  │  │   Portal    │  │  Dashboard  │              │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │   │
│  └─────────┼────────────────┼────────────────┼──────────────────────┘   │
│            │                │                │                           │
│            ▼                ▼                ▼                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      SMART CONTRACTS (Arbitrum)                   │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                 ServiceCreditToken (ERC1155)                 │ │   │
│  │  │  - createService()  - mintCredit()  - redeemCredit()        │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                              │                                    │   │
│  │         ┌────────────────────┼────────────────────┐              │   │
│  │         ▼                    ▼                    ▼              │   │
│  │  ┌─────────────┐     ┌─────────────┐      ┌─────────────┐       │   │
│  │  │ Liquidity   │     │ Marketplace │      │  Redemption │       │   │
│  │  │    Pool     │     │ (Order Book)│      │    Oracle   │       │   │
│  │  └──────┬──────┘     └─────────────┘      └──────┬──────┘       │   │
│  │         │                                        │               │   │
│  │         │         IEXEC TEE LAYER                │               │   │
│  │         │    ┌───────────────────────────┐       │               │   │
│  │         └───►│  ConfidentialCreditOracle │◄──────┘               │   │
│  │              │  - requestCreditScore()   │                       │   │
│  │              │  - receiveCreditScore()   │                       │   │
│  │              └────────────┬──────────────┘                       │   │
│  │                           │                                       │   │
│  └───────────────────────────┼───────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     iEXEC CONFIDENTIAL COMPUTE                    │   │
│  │                                                                   │   │
│  │   ┌─────────────────────────────────────────────────────────┐    │   │
│  │   │                   SGX/TDX TEE Enclave                    │    │   │
│  │   │                                                          │    │   │
│  │   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │   │
│  │   │  │    Credit    │  │   Invoice    │  │    Yield     │   │    │   │
│  │   │  │   Scoring    │  │  Processing  │  │ Distribution │   │    │   │
│  │   │  │    iApp      │  │    iApp      │  │    iApp      │   │    │   │
│  │   │  └──────────────┘  └──────────────┘  └──────────────┘   │    │   │
│  │   │                                                          │    │   │
│  │   │  INPUT: Encrypted business data                         │    │   │
│  │   │  OUTPUT: Score + Attestation (no raw data exposed)      │    │   │
│  │   │                                                          │    │   │
│  │   └──────────────────────────────────────────────────────────┘    │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      DATA SOURCES (Encrypted)                     │   │
│  │                                                                   │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │   │ Stripe  │  │  Bank   │  │ Invoice │  │ Reclaim │            │   │
│  │   │   API   │  │   API   │  │  Data   │  │  zkTLS  │            │   │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │
│  │                                                                   │   │
│  │   All data encrypted BEFORE leaving business's system            │   │
│  │   Only TEE can decrypt (with business's permission)              │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Reclaim + iExec: Complementary Privacy Stack

| Layer | Reclaim Protocol | iExec TEE |
|-------|------------------|-----------|
| **Purpose** | Prove data EXISTS | Process data PRIVATELY |
| **Mechanism** | zkTLS (zero-knowledge over HTTPS) | SGX/TDX enclave execution |
| **Output** | Boolean proofs (revenue > $10K? YES) | Computed results (score = 742) |
| **Use Case** | Threshold verification | Complex calculations |
| **Example** | "Has Stripe revenue > $10K" | "Compute exact credit score from revenue history" |

**Combined Flow:**
1. Reclaim proves business has Stripe account with revenue > threshold (gating)
2. iExec TEE computes actual credit score using full revenue data (computation)
3. Only businesses that pass Reclaim gate can submit to TEE (cost efficiency)

---

## Bonus: Account Abstraction Integration

For the +$300 bonus, integrate ERC-4337 Account Abstraction:

```solidity
// Users don't need ETH for gas - sponsor credit score requests
contract CreditScorePaymaster is BasePaymaster {
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Sponsor gas for credit score requests
        if (isCreditorScoreRequest(userOp.callData)) {
            return (abi.encode(userOp.sender), 0);
        }
        revert("Not sponsored");
    }
}
```

---

## Conclusion

iExec TEE integration transforms ServiceFi from a "transparent DeFi protocol" to a "**confidential RealFi infrastructure**":

| Before (Current) | After (With iExec TEE) |
|------------------|------------------------|
| Credit scores computed off-chain, unverifiable | Credit scores computed in TEE with attestation |
| Invoice data visible to verifiers | Invoice aggregates only, individual data private |
| LP positions exposed to providers | Yield distributed via Merkle proofs, positions hidden |
| Redemption patterns trackable | Only aggregate stats on-chain |

**Hackathon Recommendation**: Focus on **Confidential Credit Scoring** for maximum impact with clear RWA value proposition.
