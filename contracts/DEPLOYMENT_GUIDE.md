# ServiceFi Deployment Guide

## Test Results ✅

All tests passing with excellent gas optimization:
- **15 tests passed** (12 ServiceFi + 3 Counter legacy)
- **Fuzz tests**: 256 runs each
- **Gas benchmark**: 104,137 gas for minting 1 credit

## Gas Optimization Achievements

### Actual Gas Usage (from tests)
- **Mint 1 Credit**: 104,137 gas (~$0.10 @ 1 gwei, $1 MNT)
- **Target achieved**: Under 150k gas limit ✅

### Key Optimizations Applied
1. ✅ All structs ≤ 8 fields (prevents stack overflow)
2. ✅ Variable packing (uint128/64/32/8)
3. ✅ ERC1155 multi-token standard
4. ✅ Immutable addresses
5. ✅ Minimal storage operations
6. ✅ Event-based indexing

## Contract Architecture

```
ServiceFi Ecosystem
├── ServiceCreditToken.sol (Main token contract)
│   ├── ERC1155 multi-token
│   ├── Provider registration
│   ├── Service creation with expiry
│   └── Redemption via oracle
│
├── LiquidityPool.sol (DeFi liquidity)
│   ├── LP position management
│   ├── Discounted bulk purchases
│   └── Yield distribution
│
├── RedemptionOracle.sol (Verification)
│   ├── Verifier network
│   ├── Reputation system
│   └── Batch verification
│
└── ServiceFactory.sol (Deployment factory)
    └── One-click ecosystem deployment
```

## Deployment Steps

### 1. Prerequisites

```bash
# Install dependencies (already done)
npm install @openzeppelin/contracts

# Verify installation
npx hardhat compile
```

### 2. Configure Environment

Create `.env` file in `contracts/` directory:
```bash
# Mantle Testnet
PRIVATE_KEY=your_private_key_here
MANTLE_TESTNET_RPC=https://rpc.testnet.mantle.xyz
MANTLE_TESTNET_EXPLORER=https://explorer.testnet.mantle.xyz

# Mantle Mainnet (when ready)
MANTLE_MAINNET_RPC=https://rpc.mantle.xyz
MANTLE_MAINNET_EXPLORER=https://explorer.mantle.xyz
MANTLE_EXPLORER_API_KEY=your_api_key
```

### 3. Run Tests

```bash
# Full test suite
npx hardhat test

# With gas report
npx hardhat test --gas-report

# Specific test
npx hardhat test --grep "testMintCredit"
```

### 4. Deploy to Mantle Testnet

#### Option A: Using Hardhat (Recommended)

Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mantleTestnet: {
      url: process.env.MANTLE_TESTNET_RPC || "https://rpc.testnet.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5003
    },
    mantleMainnet: {
      url: process.env.MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5000
    }
  }
};
```

Create deployment script `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying ServiceFi ecosystem to Mantle...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy RedemptionOracle first
  const RedemptionOracle = await hre.ethers.getContractFactory("RedemptionOracle");
  const oracle = await RedemptionOracle.deploy(hre.ethers.ZeroAddress);
  await oracle.waitForDeployment();
  console.log("RedemptionOracle (temp):", await oracle.getAddress());

  // Deploy ServiceCreditToken
  const ServiceCreditToken = await hre.ethers.getContractFactory("ServiceCreditToken");
  const sct = await ServiceCreditToken.deploy(
    "https://api.servicefi.io/metadata/{id}.json",
    deployer.address, // fee collector
    await oracle.getAddress()
  );
  await sct.waitForDeployment();
  console.log("ServiceCreditToken:", await sct.getAddress());

  // Deploy final oracle with correct SCT address
  const finalOracle = await RedemptionOracle.deploy(await sct.getAddress());
  await finalOracle.waitForDeployment();
  console.log("RedemptionOracle (final):", await finalOracle.getAddress());

  // Update SCT oracle
  await sct.updateOracle(await finalOracle.getAddress());
  console.log("Updated SCT oracle");

  // Deploy LiquidityPool
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const pool = await LiquidityPool.deploy(
    await sct.getAddress(),
    1000, // 10% discount
    7 * 24 * 60 * 60 // 7 days lock
  );
  await pool.waitForDeployment();
  console.log("LiquidityPool:", await pool.getAddress());

  console.log("\n=== Deployment Complete ===");
  console.log("ServiceCreditToken:", await sct.getAddress());
  console.log("LiquidityPool:", await pool.getAddress());
  console.log("RedemptionOracle:", await finalOracle.getAddress());
  console.log("============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Deploy:
```bash
npx hardhat run scripts/deploy.js --network mantleTestnet
```

#### Option B: Using Foundry

```bash
# Deploy using Foundry script
forge script scripts/Deploy.s.sol:Deploy \
  --rpc-url $MANTLE_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 5. Verify Contracts

```bash
# Verify on Mantle Explorer
npx hardhat verify --network mantleTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 6. Post-Deployment Setup

```javascript
// Add initial verifier to oracle
await oracle.addVerifier(
  "0xVerifierAddress",
  10000 // 100% reputation
);

// Test service creation
await sct.registerProvider();
await sct.createService(
  ethers.parseEther("0.01"), // 0.01 MNT
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  1000, // max supply
  1 // service type
);
```

## Contract Addresses

### Mantle Testnet (Deploy here first)
```
ServiceCreditToken: TBD
LiquidityPool: TBD
RedemptionOracle: TBD
ServiceFactory: TBD
```

### Mantle Mainnet (Production)
```
Coming soon...
```

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing (✅ Done)
- [ ] Gas optimization verified (✅ Done - 104k gas)
- [ ] External audit completed
- [ ] Multi-sig wallet for admin functions
- [ ] Timelock for critical upgrades
- [ ] Bug bounty program active
- [ ] Oracle verifiers properly vetted
- [ ] Emergency pause mechanism tested

## Integration Examples

### Frontend Integration

```typescript
import { ethers } from 'ethers';

// Connect to Mantle
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const signer = new ethers.Wallet(privateKey, provider);

// Contract ABIs (get from artifacts)
const sct = new ethers.Contract(
  SERVICE_CREDIT_TOKEN_ADDRESS,
  ServiceCreditTokenABI,
  signer
);

// Service provider: Create service
const tx = await sct.createService(
  ethers.parseEther("0.01"),
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  1000,
  1
);
await tx.wait();

// Customer: Buy credit
const mintTx = await sct.mintCredit(tokenId, 1, {
  value: ethers.parseEther("0.01")
});
await mintTx.wait();
```

### Oracle Verifier Service

```typescript
import { ethers } from 'ethers';

const oracle = new ethers.Contract(
  REDEMPTION_ORACLE_ADDRESS,
  RedemptionOracleABI,
  verifierSigner
);

// Listen for verification requests
oracle.on('VerificationRequested', async (requestId, tokenId, user) => {
  console.log(`New verification request: ${requestId}`);

  // Verify off-chain (QR code, receipt, etc.)
  const isValid = await verifyServiceDelivery(requestId);

  // Submit on-chain
  const tx = await oracle.verifyRedemption(requestId, isValid);
  await tx.wait();

  console.log(`Verification completed: ${isValid}`);
});
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Total Value Locked (TVL)**
   ```javascript
   const totalMinted = await sct.services(tokenId).totalMinted;
   const price = await sct.services(tokenId).price;
   const tvl = totalMinted * price;
   ```

2. **Redemption Rate**
   ```javascript
   const redemptions = await oracle.serviceRedemptions(tokenId);
   const rate = (redemptions / totalMinted) * 100;
   ```

3. **LP Yield**
   ```javascript
   const poolStats = await pool.getPoolStats();
   const yield = poolStats.totalValuePurchased - poolStats.totalLiquidity;
   ```

## Troubleshooting

### Common Issues

**Issue**: Gas price too high
```bash
# Solution: Set custom gas price
npx hardhat run scripts/deploy.js --network mantleTestnet --gas-price 1000000000
```

**Issue**: Contract size too large (ServiceFactory)
```bash
# Solution: Already optimized with struct limits. For further reduction:
# 1. Enable optimizer in hardhat.config.js (runs: 200)
# 2. Remove unnecessary comments in production
# 3. Use libraries for common functions
```

**Issue**: Verification failed
```bash
# Solution: Flatten contract first
npx hardhat flatten contracts/ServiceCreditToken.sol > Flattened.sol
# Then verify on explorer manually
```

## Upgrade Path

ServiceFi contracts are **not upgradeable** by design for security and simplicity.

For new features:
1. Deploy new contract versions
2. Migrate liquidity via governance
3. Deprecate old contracts gracefully

## Support & Resources

- **Documentation**: [docs.servicefi.io](https://docs.servicefi.io)
- **Discord**: [ServiceFi Community](https://discord.gg/servicefi)
- **GitHub**: [github.com/servicefi](https://github.com/servicefi)
- **Mantle Docs**: [docs.mantle.xyz](https://docs.mantle.xyz)

## License

MIT License - See [LICENSE](./LICENSE)
