# ServiceFi Hardhat Ignition Deployment Guide

## Prerequisites

1. **Install Dependencies**
```bash
cd contracts
npm install
```

2. **Set Environment Variables**

Create `.env` file:
```bash
PRIVATE_KEY_MANTLE=your_private_key_here
MANTLE_EXPLORER_API_KEY=your_explorer_api_key
```

3. **Get Testnet MNT**
- Visit: https://faucet.testnet.mantle.xyz
- Request testnet tokens

## Deployment Steps

### 1. Compile Contracts

```bash
npx hardhat compile
```

### 2. Test Deployment Locally

```bash
npx hardhat ignition deploy ignition/modules/ServiceFi.ts
```

### 3. Deploy to Mantle Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/ServiceFi.ts \
  --network mantleSepolia \
  --parameters ignition/parameters/mantle-testnet.json
```

### 4. Deploy to Mantle Mainnet

```bash
npx hardhat ignition deploy ignition/modules/ServiceFi.ts \
  --network mantle \
  --parameters ignition/parameters/mantle-mainnet.json \
  --verify
```

## Deployment Outputs

After successful deployment, you'll see:

```
✔ ServiceFiModule#ServiceCreditToken deployed
✔ ServiceFiModule#LiquidityPool deployed
✔ ServiceFiModule#RedemptionOracle deployed
✔ ServiceFiModule#ServiceFactory deployed

Deployed Addresses:
- ServiceCreditToken: 0x...
- LiquidityPool: 0x...
- RedemptionOracle: 0x...
- ServiceFactory: 0x...
```

## Update Frontend Contract Addresses

After deployment, update `/frontend/lib/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  mantleTestnet: {
    serviceCreditToken: "0xYOUR_DEPLOYED_ADDRESS",
    liquidityPool: "0xYOUR_DEPLOYED_ADDRESS",
    redemptionOracle: "0xYOUR_DEPLOYED_ADDRESS",
    serviceFactory: "0xYOUR_DEPLOYED_ADDRESS",
  },
};
```

## Verification

Contracts are automatically verified if you use `--verify` flag.

Manual verification:
```bash
npx hardhat verify --network mantleSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Testing Deployed Contracts

```bash
# Test on testnet
npx hardhat test --network mantleSepolia

# Run specific test
npx hardhat test --network mantleSepolia --grep "testMintCredit"
```

## Deployment Parameters

Edit `ignition/parameters/mantle-testnet.json`:

```json
{
  "ServiceFiModule": {
    "metadataUri": "https://api.servicefi.io/metadata/{id}.json",
    "discountBps": 1000,
    "minLockPeriod": 604800
  }
}
```

- **metadataUri**: Base URI for service metadata
- **discountBps**: LP discount (1000 = 10%)
- **minLockPeriod**: Minimum lock period in seconds (604800 = 7 days)

## Troubleshooting

**Issue**: Deployment fails with "insufficient funds"
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network mantleSepolia
```

**Issue**: Nonce too high
```bash
# Reset nonce in Hardhat Ignition
rm -rf ignition/deployments
```

**Issue**: Contract size too large
```bash
# Already optimized with runs: 200
# ServiceFactory may show warning but will deploy
```

## Next Steps

1. ✅ Deploy to Mantle Sepolia
2. ✅ Update frontend addresses
3. ✅ Test full user flows
4. ✅ Verify on explorer
5. ⏳ External audit (before mainnet)
6. ⏳ Deploy to mainnet

## Quick Commands Reference

```bash
# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy to testnet
npx hardhat ignition deploy ignition/modules/ServiceFi.ts --network mantleSepolia

# Deploy to mainnet
npx hardhat ignition deploy ignition/modules/ServiceFi.ts --network mantle --verify

# Check deployment
npx hardhat ignition status ServiceFiModule --network mantleSepolia
```

## Contract Interaction After Deployment

```typescript
import { ethers } from "hardhat";

async function main() {
  const ServiceCreditToken = await ethers.getContractAt(
    "ServiceCreditToken",
    "0xYOUR_DEPLOYED_ADDRESS"
  );

  // Register as provider
  await ServiceCreditToken.registerProvider();

  // Create service
  const tx = await ServiceCreditToken.createService(
    ethers.parseEther("0.01"),
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    1000,
    1
  );
  await tx.wait();
}

main();
```
