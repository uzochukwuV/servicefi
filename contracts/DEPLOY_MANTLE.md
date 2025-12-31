# Deploy ServiceFi to Mantle Sepolia - Quick Guide

## Option 1: Force Fresh Deployment (Recommended)

```bash
# Remove stuck deployment
rm -rf ignition/deployments/chain-5003

# Deploy fresh
npx hardhat ignition deploy ignition/modules/ServiceFi.ts \
  --network mantleSepolia \
  --parameters ignition/parameters/mantle-testnet.json \
  --deployment-id servicefi-v1 \
  --verify
```

## Option 2: Resume with Transaction Tracking

If you see error about transaction with nonce 3:

1. **Find transaction on explorer:**
   - Go to: https://explorer.testnet.mantle.xyz/address/0xe8d612c98890defdf53c6f472ae90531b642eba1
   - Find transaction with nonce 3
   - Copy transaction hash

2. **Track the transaction:**
```bash
npx hardhat ignition track-tx <TRANSACTION_HASH> chain-5003 --network mantleSepolia
```

3. **Resume deployment:**
```bash
npx hardhat ignition deploy ignition/modules/ServiceFi.ts \
  --network mantleSepolia \
  --parameters ignition/parameters/mantle-testnet.json \
  --verify
```

## Option 3: Use Different Account Nonce

Wait 5-10 minutes for pending transactions to clear, then retry.

## After Successful Deployment

You'll see:
```
[ ServiceFiModule ] successfully deployed 🚀

Deployed Addresses

ServiceFiModule#ServiceCreditToken - 0x...
ServiceFiModule#LiquidityPool - 0x...
ServiceFiModule#RedemptionOracle - 0x...
```

Copy these addresses and update `/frontend/lib/contracts/addresses.ts`
