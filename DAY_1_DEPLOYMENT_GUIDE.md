# Day 1 Deployment Guide

## ✅ Completed Tasks

### 1. Frontend Build Fixed
- ✅ Removed WalletConnect (causing Turbopack issues)
- ✅ Fixed TypeScript errors (chainName issues)
- ✅ Build now succeeds: `npm run build`
- ✅ Using MetaMask (injected wallet) for now

### 2. Environment Setup
- ✅ Created `frontend/.env.local`
- ✅ Created `contracts/.env`
- ✅ Created Hardhat deployment script

---

## 🚀 Next Step: Deploy Contracts

### Prerequisites

**IMPORTANT:** Add your private key to `E:\apps\servicefi\contracts\.env`

Edit the file and replace:
```env
PRIVATE_KEY_MANTLE=your_private_key_with_0x_prefix
```

With your actual private key (must start with 0x).

### Deployment Commands

#### Option 1: Hardhat (Recommended)
```bash
cd E:\apps\servicefi\contracts
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

#### Option 2: Foundry
```bash
cd E:\apps\servicefi\contracts
forge script scripts/Deploy.s.sol:Deploy \
  --rpc-url https://mantle-sepolia.drpc.org \
  --broadcast \
  --verify
```

### Expected Output

The deployment will:
1. Deploy 4 contracts (takes ~2-3 minutes)
2. Save addresses to `./deployments/mantle-sepolia.json`
3. Print contract addresses

Example:
```
ServiceCreditToken: 0x1234...
LiquidityPool:      0x5678...
RedemptionOracle:   0x9abc...
ServiceFactory:     0xdef0...
```

---

## 📝 After Deployment

### 1. Update Frontend Addresses

Edit `E:\apps\servicefi\frontend\lib\contracts\addresses.ts`:

```typescript
mantleSepoliaTestnet: {
  serviceCreditToken: "0xYOUR_ADDRESS_HERE",
  liquidityPool: "0xYOUR_ADDRESS_HERE",
  redemptionOracle: "0xYOUR_ADDRESS_HERE",
  serviceFactory: "0xYOUR_ADDRESS_HERE",
},
```

### 2. Verify Contracts (Optional but Recommended)

Contracts should auto-verify, but if not:

```bash
npx hardhat verify --network mantleSepolia 0xYOUR_CONTRACT_ADDRESS
```

### 3. Test Frontend

```bash
cd E:\apps\servicefi\frontend
npm run dev
```

Open http://localhost:3000 and:
- Click "Connect Wallet"
- Connect MetaMask
- Switch to Mantle Sepolia network

---

## 🐛 Troubleshooting

### "Insufficient funds" Error
Get testnet MNT from faucet:
- https://faucet.mantle.xyz

### "Invalid private key" Error
Ensure your private key:
- Starts with `0x`
- Is 66 characters long (0x + 64 hex chars)
- Has no spaces or quotes

### "Network not found" Error
Add Mantle Sepolia to MetaMask:
- Network Name: Mantle Sepolia
- RPC URL: https://mantle-sepolia.drpc.org
- Chain ID: 5003
- Currency: MNT
- Explorer: https://explorer.sepolia.mantle.xyz

---

## 📊 Day 1 Progress

- ✅ Build system fixed
- ✅ Environment configured
- ✅ Deployment script ready
- ⏳ **NEXT:** Run deployment
- ⏳ Update frontend addresses
- ⏳ Test wallet connection

**Estimated Time Remaining:** 30 minutes

---

## Quick Commands Reference

### Test Contract Compilation
```bash
cd E:\apps\servicefi\contracts
npx hardhat compile
npx hardhat test
```

### Test Frontend Build
```bash
cd E:\apps\servicefi\frontend
npm run build
npm run dev
```

### Deploy Contracts
```bash
cd E:\apps\servicefi\contracts
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

---

**Status:** Ready to deploy! Just add your private key and run the deployment command.
