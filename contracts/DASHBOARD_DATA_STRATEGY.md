# ServiceFi Dashboard Data Strategy

## Problem Statement

The business dashboard needs metrics that aren't directly available in current contracts:
- ❌ Redemption rate per service
- ❌ Business score/rating
- ❌ Total revenue by provider
- ❌ All services by a specific provider
- ❌ Monthly growth metrics

## Current Contract Data

### ✅ Available On-Chain

```solidity
// ServiceMetadata
services[tokenId].price           // Service price
services[tokenId].totalMinted     // Active tokens
services[tokenId].maxSupply       // Max supply
services[tokenId].active          // Status

// Provider Info
providers[address].serviceCount   // Number of services
providers[address].verified       // Verification status

// Redemptions
redemptions[tokenId]              // Array of redemption records
redemptions[tokenId].length       // Total redeemed count
```

### ❌ Not Available

- Redemption rate (need to calculate)
- Revenue per provider
- Services list by provider
- Business ratings
- Time-series data

## Recommended Solution: Hybrid Approach

Use **current gas-optimized contracts** + **event indexing** for dashboard metrics.

### Architecture

```
Smart Contracts (On-Chain)
    ↓ emit events
Event Indexer (The Graph / Custom)
    ↓ process & aggregate
PostgreSQL / MongoDB
    ↓ query
Frontend Dashboard
```

## Implementation Plan

### Phase 1: Use Current Contracts (No Changes Needed) ✅

**What Works Now:**
```typescript
// Get service info
const { data } = useServiceInfo(tokenId);
const activeTokens = data[3]; // totalMinted
const price = data[0];

// Get redemption count
const redemptions = await contract.redemptions(tokenId);
const redeemedCount = redemptions.length;

// Calculate redemption rate
const redemptionRate = (redeemedCount / activeTokens) * 100;
```

### Phase 2: Add Helper View Functions (Optional, Low Gas Impact)

If you want easier queries, add view functions that don't change state:

```solidity
// Add to ServiceCreditToken.sol

/**
 * @notice Get redemption count for a service
 */
function getRedemptionCount(uint256 tokenId)
    external
    view
    returns (uint256)
{
    return redemptions[tokenId].length;
}

/**
 * @notice Get redemption rate (percentage)
 */
function getRedemptionRate(uint256 tokenId)
    external
    view
    returns (uint256)
{
    ServiceMetadata memory service = services[tokenId];
    if (service.totalMinted == 0) return 0;

    uint256 redeemed = redemptions[tokenId].length;
    return (redeemed * 10000) / service.totalMinted; // Return in basis points
}

/**
 * @notice Get total revenue for a service
 */
function getServiceRevenue(uint256 tokenId)
    external
    view
    returns (uint128)
{
    return uint128(services[tokenId].price * redemptions[tokenId].length);
}
```

**Gas Impact:** ✅ Zero (view functions don't cost gas)

### Phase 3: Event Indexing for Complex Queries

For features like:
- All services by provider
- Business ratings
- Historical data
- Analytics

Use **The Graph** or custom indexer:

```graphql
# Example Query
{
  provider(id: "0xabc...") {
    services {
      id
      price
      totalMinted
      redemptions {
        count
      }
    }
    totalRevenue
    rating
  }
}
```

## Specific Dashboard Metrics

### 1. Total Liquidity Raised ✅

**Current Implementation:**
```typescript
// Calculate from all services
const services = await getAllProviderServices(providerAddress);
const totalRevenue = services.reduce((sum, service) => {
  const redeemed = redemptions[service.tokenId].length;
  return sum + (service.price * redeemed);
}, 0);
```

**With Helper Function:**
```typescript
const revenue = await contract.getServiceRevenue(tokenId);
```

### 2. Active Tokens ✅

**Current Implementation:**
```typescript
const { totalMinted } = await contract.services(tokenId);
```

### 3. Redemption Rate ✅

**Current Implementation:**
```typescript
const totalMinted = await contract.services(tokenId).totalMinted;
const redemptions = await contract.redemptions(tokenId);
const rate = (redemptions.length / totalMinted) * 100;
```

**With Helper Function:**
```typescript
const rateBps = await contract.getRedemptionRate(tokenId);
const ratePercent = rateBps / 100; // Convert basis points to percentage
```

### 4. Business Score ❌ (Not in Contract)

**Options:**

**A) Off-Chain (Recommended)**
- Store ratings in database
- Calculate average from customer feedback
- Link to provider address

**B) Add Rating System to Contract**
```solidity
// New struct (6 fields - still safe)
struct ProviderRating {
    address provider;
    uint32 totalReviews;
    uint32 totalStars;     // Sum of all ratings
    uint16 averageRating;  // Cached average * 100
    uint64 lastUpdated;
    bool active;
}

mapping(address => ProviderRating) public ratings;

function rateProvider(address provider, uint8 stars) external {
    require(stars >= 1 && stars <= 5, "Invalid rating");
    // Update rating logic
}
```

**Gas Cost:** ~50k gas per rating (expensive for users)

## Decision Matrix

| Metric | Current Contract | Add View Function | Event Indexer | Off-Chain DB |
|--------|-----------------|-------------------|---------------|--------------|
| Active Tokens | ✅ Direct | - | - | - |
| Redemption Count | ✅ Array length | ⚡ Better | - | - |
| Redemption Rate | ✅ Calculate | ⚡ Better | - | - |
| Total Revenue | ✅ Calculate | ⚡ Better | - | - |
| Business Score | ❌ | ⚠️ Expensive | - | ✅ Best |
| Provider Services List | ❌ | ❌ | ✅ Best | ✅ Best |
| Monthly Growth | ❌ | ❌ | ✅ Best | ✅ Best |
| Historical Data | ❌ | ❌ | ✅ Best | ✅ Best |

## Recommended Approach

### Immediate (No Contract Changes)

1. **Use current contracts** with client-side calculations
2. **Calculate metrics** in frontend hooks
3. **Cache results** in React Query

```typescript
// Custom hook for dashboard metrics
export function useProviderMetrics(providerAddress: Address) {
  return useQuery({
    queryKey: ['provider-metrics', providerAddress],
    queryFn: async () => {
      // Get all services for provider (need to track off-chain or iterate)
      const services = await getProviderServices(providerAddress);

      // Calculate metrics
      let totalRevenue = 0n;
      let totalMinted = 0;
      let totalRedeemed = 0;

      for (const service of services) {
        const metadata = await contract.services(service.tokenId);
        const redemptions = await contract.redemptions(service.tokenId);

        totalMinted += metadata.totalMinted;
        totalRedeemed += redemptions.length;
        totalRevenue += metadata.price * BigInt(redemptions.length);
      }

      return {
        totalRevenue,
        activeTokens: totalMinted,
        redemptionRate: (totalRedeemed / totalMinted) * 100,
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
```

### Short Term (Add View Functions)

Add helper view functions to make queries easier (no state changes, no gas cost for users):

```solidity
// contracts/ServiceCreditToken.sol - Add these view functions

function getRedemptionCount(uint256 tokenId) external view returns (uint256);
function getRedemptionRate(uint256 tokenId) external view returns (uint256);
function getServiceRevenue(uint256 tokenId) external view returns (uint128);
```

**Deployment:** Redeploy contracts with these additions

### Long Term (Full Featured)

1. **Event Indexer** - Index all events for historical data
2. **Backend API** - Aggregate metrics, handle ratings
3. **Database** - Store off-chain data (reviews, analytics)

## Implementation: Add View Functions

If you want to extend contracts, here's the minimal addition:

```solidity
// Add to ServiceCreditToken.sol after existing functions

/**
 * @notice Helper view functions for dashboard metrics
 */

function getRedemptionCount(uint256 tokenId)
    external
    view
    returns (uint256)
{
    return redemptions[tokenId].length;
}

function getRedemptionRate(uint256 tokenId)
    external
    view
    returns (uint256 rateBps)
{
    ServiceMetadata memory service = services[tokenId];
    if (service.totalMinted == 0) return 0;

    uint256 redeemed = redemptions[tokenId].length;
    return (redeemed * 10000) / service.totalMinted;
}

function getServiceRevenue(uint256 tokenId)
    external
    view
    returns (uint128)
{
    ServiceMetadata memory service = services[tokenId];
    uint256 redeemed = redemptions[tokenId].length;
    return uint128(uint256(service.price) * redeemed);
}

function getServiceStats(uint256 tokenId)
    external
    view
    returns (
        uint128 price,
        uint32 totalMinted,
        uint256 totalRedeemed,
        uint256 redemptionRate,
        uint128 revenue,
        bool active
    )
{
    ServiceMetadata memory service = services[tokenId];
    uint256 redeemed = redemptions[tokenId].length;

    return (
        service.price,
        service.totalMinted,
        redeemed,
        service.totalMinted > 0 ? (redeemed * 10000) / service.totalMinted : 0,
        uint128(uint256(service.price) * redeemed),
        service.active
    );
}
```

**Benefits:**
- ✅ No gas cost (view functions)
- ✅ Cleaner frontend code
- ✅ Single contract call vs multiple
- ✅ Still gas-optimized

**Trade-offs:**
- ⚠️ Need to redeploy contracts
- ⚠️ Update frontend ABIs

## My Recommendation

**For MVP / Hackathon:**
- ✅ **Use current contracts as-is**
- ✅ Calculate metrics in frontend
- ✅ Mock business scores for demo
- ⏱️ Takes 30 minutes to implement

**For Production:**
- 🔧 **Add view helper functions** (shown above)
- 🔧 **Redeploy to testnet**
- 🔧 **Add event indexer** later
- ⏱️ Takes 2-3 hours

## What Should We Do?

**Option A: Keep Current Contracts** ⚡ (Fastest)
- Implement metrics calculation in frontend hooks
- Use React Query for caching
- Demo-ready in 30 minutes

**Option B: Add View Functions** 🔧 (Better DX)
- Add helper functions to contract
- Redeploy to testnet
- Update frontend
- Production-ready in 2 hours

Which would you prefer?
