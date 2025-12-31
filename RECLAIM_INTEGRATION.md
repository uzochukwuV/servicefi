# Reclaim Protocol Integration for ServiceFi

## Overview

ServiceFi will integrate Reclaim Protocol's zkTLS technology to enable privacy-preserving verification of business credentials, customer reputation, and financial data without exposing sensitive information.

**Reclaim Protocol** uses Zero-Knowledge proofs over HTTPS session keys to prove data from web2 platforms (banking, social media, business reviews) without revealing the underlying credentials or exact values.

---

## Why Reclaim Protocol is Perfect for ServiceFi

### Current ServiceFi Challenge
Businesses want to prove creditworthiness to attract liquidity, but don't want to reveal:
- Exact revenue numbers (competitors could see)
- Customer lists (privacy concerns)
- Bank account details (security risk)
- Business metrics (competitive advantage)

### Reclaim Solution
Prove data attributes **WITHOUT** revealing the data itself:
- ✅ Prove "Google Business rating > 4.5 stars" without showing exact rating
- ✅ Prove "Monthly Stripe revenue > $10K" without revealing exact amount
- ✅ Prove "Bank balance > $50K" without exposing account details
- ✅ Prove "Instagram followers > 10K" without showing exact count
- ✅ Prove "Been in business > 2 years" without revealing incorporation date

---

## Integration Architecture

### Phase 1: Business Credential Verification (Weeks 1-2)

```
┌─────────────────────────────────────────────────────────┐
│              Business Registration Flow                  │
└─────────────────────────────────────────────────────────┘

1. Business logs into external platform (e.g., Stripe)
2. Reclaim captures HTTPS session
3. Generates zkProof of revenue > threshold
4. Submits proof to ServiceFi smart contract
5. Gets verified badge on ServiceFi platform
```

#### Supported Verification Sources

**Financial Data:**
- **Stripe**: Monthly revenue, transaction count, customer count
- **PayPal**: Sales volume, dispute rate
- **QuickBooks**: Revenue, profit margins (within ranges)
- **Plaid/Bank**: Account balance, transaction history

**Reputation Data:**
- **Google Business**: Star rating, review count
- **Yelp**: Rating, years in business
- **Trustpilot**: Score, number of reviews
- **BBB**: Accreditation status, rating

**Social Proof:**
- **Instagram**: Follower count, engagement rate
- **LinkedIn**: Company size, employee count
- **Twitter**: Follower count, verification status
- **Facebook**: Page likes, check-ins

**Government Records:**
- **IRS**: Tax filing status (filed for year X)
- **Business Registry**: Years in operation, good standing
- **Professional Licenses**: Active license verification

---

## Smart Contract Integration

### ReclaimBusinessVerifier.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@reclaimprotocol/contracts/Reclaim.sol";

contract ReclaimBusinessVerifier {
    Reclaim public reclaimContract;

    enum VerificationType {
        RevenueThreshold,      // Stripe/PayPal revenue > X
        GoogleRating,          // Google Business > X stars
        BankBalance,           // Bank balance > X
        YearsInBusiness,       // Operating for > X years
        CustomerCount,         // Customer base > X
        SocialFollowers        // Social media followers > X
    }

    struct BusinessProof {
        VerificationType verificationType;
        uint256 threshold;        // Minimum value proven (without revealing exact)
        string source;            // "Stripe", "Google", "Bank of America", etc.
        uint256 verifiedAt;
        bool isActive;
    }

    mapping(address => mapping(VerificationType => BusinessProof)) public businessProofs;

    event ProofVerified(
        address indexed business,
        VerificationType verificationType,
        uint256 threshold,
        string source
    );

    constructor(address _reclaimAddress) {
        reclaimContract = Reclaim(_reclaimAddress);
    }

    /**
     * @notice Submit Reclaim zkProof of business credential
     * @param proof Reclaim proof struct
     * @param verificationType Type of verification
     * @param threshold Minimum value being proven
     * @param source Data source (e.g., "Stripe")
     */
    function verifyBusinessProof(
        Reclaim.Proof calldata proof,
        VerificationType verificationType,
        uint256 threshold,
        string calldata source
    ) external {
        // Verify Reclaim proof
        require(
            reclaimContract.verifyProof(proof),
            "Invalid Reclaim proof"
        );

        // Extract and validate claim data
        string memory context = proof.claimInfo.context;
        require(
            validateProofContext(context, verificationType, threshold),
            "Proof doesn't meet threshold"
        );

        // Store verification
        businessProofs[msg.sender][verificationType] = BusinessProof({
            verificationType: verificationType,
            threshold: threshold,
            source: source,
            verifiedAt: block.timestamp,
            isActive: true
        });

        emit ProofVerified(msg.sender, verificationType, threshold, source);
    }

    /**
     * @notice Check if business has verified credential
     */
    function hasVerification(
        address business,
        VerificationType verificationType
    ) external view returns (bool) {
        BusinessProof memory proof = businessProofs[business][verificationType];
        return proof.isActive && proof.verifiedAt + 90 days > block.timestamp;
    }

    /**
     * @notice Get verification details
     */
    function getVerification(
        address business,
        VerificationType verificationType
    ) external view returns (
        uint256 threshold,
        string memory source,
        uint256 verifiedAt
    ) {
        BusinessProof memory proof = businessProofs[business][verificationType];
        require(proof.isActive, "No active verification");
        return (proof.threshold, proof.source, proof.verifiedAt);
    }

    function validateProofContext(
        string memory context,
        VerificationType verificationType,
        uint256 threshold
    ) internal pure returns (bool) {
        // Parse JSON context from Reclaim proof
        // Verify the extracted value meets the threshold
        // Example: For RevenueThreshold, verify monthly_revenue >= threshold
        // Implementation depends on JSON parsing library
        return true; // Simplified
    }
}
```

---

## Frontend Integration

### Business Verification Flow

```typescript
// frontend/components/reclaim-business-verify.tsx

import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

export function ReclaimBusinessVerify() {
  const [selectedSource, setSelectedSource] = useState<'stripe' | 'google' | 'bank'>('stripe');

  const handleVerifyStripeRevenue = async () => {
    // 1. Initialize Reclaim SDK
    const reclaimProofRequest = await ReclaimProofRequest.init(
      'YOUR_APP_ID',
      'YOUR_APP_SECRET',
      'YOUR_PROVIDER_ID' // Stripe provider
    );

    // 2. Set proof parameters
    const threshold = 10000; // $10K monthly revenue
    reclaimProofRequest.setParams({
      url: 'https://dashboard.stripe.com/revenue',
      loginUrl: 'https://dashboard.stripe.com/login',
      selectors: ['div.monthly-revenue'], // CSS selector for revenue element
    });

    // 3. Set proof context (what to prove)
    reclaimProofRequest.setContext({
      threshold: threshold,
      verificationType: 'revenue_threshold',
      message: `Prove monthly Stripe revenue >= $${threshold}`,
    });

    // 4. Generate proof request URL
    const requestUrl = await reclaimProofRequest.getRequestUrl();

    // 5. User logs in and generates proof
    window.open(requestUrl, '_blank');

    // 6. Listen for proof
    await reclaimProofRequest.startSession({
      onSuccess: async (proofs) => {
        const proof = proofs[0];

        // 7. Submit to smart contract
        await reclaimVerifier.verifyBusinessProof(
          proof,
          0, // VerificationType.RevenueThreshold
          threshold,
          'Stripe'
        );

        toast.success('Stripe revenue verified! Badge unlocked.');
      },
      onError: (error) => {
        console.error('Proof generation failed:', error);
      },
    });
  };

  const handleVerifyGoogleRating = async () => {
    const reclaimProofRequest = await ReclaimProofRequest.init(
      'YOUR_APP_ID',
      'YOUR_APP_SECRET',
      'GOOGLE_BUSINESS_PROVIDER'
    );

    reclaimProofRequest.setParams({
      url: 'https://business.google.com/dashboard',
      loginUrl: 'https://accounts.google.com',
      selectors: ['span.rating-value'],
    });

    const minRating = 4.5;
    reclaimProofRequest.setContext({
      threshold: minRating,
      verificationType: 'google_rating',
      message: `Prove Google Business rating >= ${minRating} stars`,
    });

    const requestUrl = await reclaimProofRequest.getRequestUrl();
    window.open(requestUrl, '_blank');

    await reclaimProofRequest.startSession({
      onSuccess: async (proofs) => {
        await reclaimVerifier.verifyBusinessProof(
          proofs[0],
          1, // VerificationType.GoogleRating
          Math.floor(minRating * 100), // Convert to basis points
          'Google Business'
        );

        toast.success('Google rating verified! Trust badge earned.');
      },
    });
  };

  return (
    <Card>
      <h2>Verify Your Business Credentials</h2>
      <p className="text-sm text-muted-foreground">
        Prove your business metrics without revealing exact numbers
      </p>

      <Tabs value={selectedSource} onValueChange={setSelectedSource}>
        <TabsList>
          <TabsTrigger value="stripe">Financial</TabsTrigger>
          <TabsTrigger value="google">Reputation</TabsTrigger>
          <TabsTrigger value="bank">Banking</TabsTrigger>
        </TabsList>

        <TabsContent value="stripe">
          <div className="space-y-4">
            <h3>Stripe Revenue Verification</h3>
            <p className="text-sm">
              Prove your monthly revenue exceeds $10,000 without revealing the exact amount
            </p>

            <div className="bg-muted p-4 rounded">
              <h4 className="font-medium mb-2">What we'll verify:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Monthly revenue ≥ $10,000</li>
                <li>✗ Exact revenue amount (private)</li>
                <li>✗ Customer names (private)</li>
                <li>✗ Transaction details (private)</li>
              </ul>
            </div>

            <Button onClick={handleVerifyStripeRevenue} className="w-full">
              Connect Stripe & Generate Proof
            </Button>

            <p className="text-xs text-muted-foreground">
              Powered by Reclaim Protocol zkTLS
            </p>
          </div>
        </TabsContent>

        <TabsContent value="google">
          <div className="space-y-4">
            <h3>Google Business Rating</h3>
            <p className="text-sm">
              Prove your rating is above 4.5 stars without revealing the exact rating
            </p>

            <Button onClick={handleVerifyGoogleRating} className="w-full">
              Verify Google Business Rating
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <div className="space-y-4">
            <h3>Bank Balance Verification</h3>
            <p className="text-sm">
              Prove your business account balance exceeds $50,000
            </p>

            <Button onClick={() => handleBankVerification()} className="w-full">
              Connect Bank via Plaid
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

---

## Phase 2: Customer Reputation Proofs (Weeks 3-4)

### Use Case: Marketplace Trust Scores

Customers can prove:
- ✅ Amazon purchase history > $5K (reliable buyer)
- ✅ Uber rating > 4.8 (good behavior)
- ✅ Airbnb superhost status (trustworthy)
- ✅ eBay seller rating > 98% (low dispute rate)

**Benefit**: Sellers can offer discounts to verified high-reputation buyers without exposing personal purchase history.

```solidity
contract ReclaimCustomerReputation {
    struct ReputationProof {
        string platform;     // "Amazon", "Uber", "Airbnb"
        uint256 scoreThreshold; // Minimum score proven
        uint256 verifiedAt;
    }

    mapping(address => ReputationProof[]) public customerProofs;

    function verifyReputation(
        Reclaim.Proof calldata proof,
        string calldata platform,
        uint256 scoreThreshold
    ) external {
        require(reclaimContract.verifyProof(proof), "Invalid proof");

        customerProofs[msg.sender].push(ReputationProof({
            platform: platform,
            scoreThreshold: scoreThreshold,
            verifiedAt: block.timestamp
        }));

        // Unlock marketplace perks based on reputation
        emit ReputationVerified(msg.sender, platform, scoreThreshold);
    }
}
```

---

## Phase 3: Liquidity Provider Accreditation (Weeks 5-6)

### Use Case: Accredited Investor Verification

LPs can prove accredited investor status without revealing exact net worth:
- ✅ Annual income > $200K (via tax return)
- ✅ Net worth > $1M (via brokerage account)
- ✅ Professional certifications (CPA, attorney)

```solidity
contract ReclaimAccreditedInvestor {
    mapping(address => bool) public isAccredited;

    function verifyAccreditation(
        Reclaim.Proof calldata proof
    ) external {
        require(reclaimContract.verifyProof(proof), "Invalid proof");

        // Verify proof shows income > $200K or net worth > $1M
        isAccredited[msg.sender] = true;

        // Unlock institutional LP features
        emit InvestorAccredited(msg.sender);
    }
}
```

---

## Reclaim Providers Needed

### Custom Providers to Build

| Provider | Data Source | Proof Output | Priority |
|----------|-------------|--------------|----------|
| Stripe | dashboard.stripe.com | Monthly revenue >= X | High |
| Google Business | business.google.com | Rating >= X stars | High |
| QuickBooks | app.qbo.intuit.com | Revenue >= X | Medium |
| LinkedIn | linkedin.com/company | Employee count >= X | Medium |
| Plaid/Bank | Various banks | Balance >= X | Low |
| Yelp | biz.yelp.com | Rating >= X | Low |

Each provider needs:
1. **Login URL**: Where to authenticate
2. **Data URL**: Where proof data lives
3. **CSS Selectors**: Which elements to extract
4. **Validation Logic**: How to verify thresholds

---

## Grant Proposal Alignment

### RFP Categories We Address

**Finance:**
- ✅ **SMB Lending Verification**: Prove revenue without revealing exact amounts
- ✅ **Shopping History Discounts**: Verify purchase history for loyalty rewards

**Bootstrapping:**
- ✅ **Deals Marketplace**: Reputation-based discount eligibility

**Blockchain:**
- ✅ **Real-World Asset Tokenization**: Service credits backed by verified businesses
- ✅ **Decentralized Data Feeds**: Business metrics for LP decision-making

---

## Implementation Timeline

### Month 1: Foundation
- Week 1: Integrate Reclaim SDK into frontend
- Week 2: Deploy ReclaimBusinessVerifier contract
- Week 3: Build Stripe revenue provider
- Week 4: Build Google Business rating provider

### Month 2: Expansion
- Week 5: Customer reputation system
- Week 6: LP accreditation verification
- Week 7: Banking/Plaid integration
- Week 8: Testing and audit

### Month 3: Polish
- Week 9: UI/UX improvements
- Week 10: Documentation and tutorials
- Week 11: Security audit
- Week 12: Mainnet launch

---

## Success Metrics

**Adoption:**
- 100+ businesses with verified credentials
- 50+ custom providers built
- 1000+ proofs generated monthly

**Privacy Impact:**
- 0 exact revenue numbers revealed publicly
- 100% of businesses use threshold proofs
- 0 credential leaks

**Economic Impact:**
- 20% more liquidity to verified businesses
- 15% lower fraud rate
- 30% higher customer trust scores

---

## Technical Requirements

### Dependencies
```json
{
  "@reclaimprotocol/js-sdk": "^2.0.0",
  "@reclaimprotocol/contracts": "^1.0.0"
}
```

### Smart Contract Integration
```solidity
import "@reclaimprotocol/contracts/Reclaim.sol";
import "@reclaimprotocol/contracts/Claims.sol";
```

### Frontend Integration
```typescript
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
```

---

## Cost Estimate

### Development Costs
- Smart contract development: 40 hours @ $150/hr = $6,000
- Frontend integration: 60 hours @ $100/hr = $6,000
- Custom provider development: 80 hours @ $100/hr = $8,000
- Testing & audit: $5,000
- **Total: $25,000**

### Grant Request
**Requesting: $20,000** from Reclaim Protocol Grant Program

**Breakdown:**
- Smart contracts: $6,000
- Frontend: $6,000
- Providers: $8,000

---

## Why ServiceFi is Perfect for Reclaim

1. **Real Use Case**: Actual businesses need to prove creditworthiness
2. **Privacy Critical**: Revenue data is highly sensitive
3. **Large TAM**: Millions of service businesses worldwide
4. **Network Effects**: More businesses = more data diversity
5. **Regulatory Friendly**: Compliant with privacy laws (GDPR, CCPA)

---

## Next Steps

1. **Apply for Reclaim Grant** on Questbook
2. **Join Reclaim Discord** for technical support
3. **Deploy POC** with Stripe + Google Business providers
4. **User Testing** with 10 pilot businesses
5. **Launch Beta** on Mantle Sepolia
6. **Mainnet Deployment** after audit

---

## Resources

- Reclaim Docs: https://docs.reclaimprotocol.org/
- Grant Application: https://questbook.app/
- Technical Blog: https://blog.reclaimprotocol.org/posts/zk-in-zktls
- GitHub: https://github.com/reclaimprotocol

**Contact**: Apply via Questbook for grant consideration
