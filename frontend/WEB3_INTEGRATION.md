# ServiceFi Web3 Integration Guide

## Overview

The ServiceFi frontend is now fully integrated with Web3 functionality, enabling users to interact with smart contracts on Mantle Network.

## Architecture

```
frontend/
├── lib/
│   ├── contracts/
│   │   ├── abis.ts              # Contract ABIs
│   │   └── addresses.ts         # Contract addresses & chain config
│   └── wagmi-config.ts         # Wagmi configuration
├── hooks/
│   ├── useServiceCredit.ts     # Service token interactions
│   ├── useLiquidityPool.ts     # LP pool interactions
│   └── useRedemptionOracle.ts  # Oracle interactions
├── providers/
│   └── web3-provider.tsx       # Web3 context provider
└── components/
    └── wallet-connect.tsx      # Wallet connection UI
```

## Features Implemented

### ✅ Wallet Connection
- MetaMask, WalletConnect support
- Multi-wallet connector dropdown
- Network switching (Mantle Testnet ↔ Mainnet)
- Address display with copy/view explorer
- Auto-detect wrong network

### ✅ Smart Contract Hooks

#### 1. useServiceCredit()
For service providers and customers:

```typescript
const {
  // Read functions
  useProviderInfo,
  useServiceInfo,
  useBalance,
  useNextTokenId,
  // Write functions
  registerProvider,
  createService,
  mintCredit,
  // Transaction state
  isPending,
  isConfirming,
  isSuccess,
} = useServiceCredit();
```

#### 2. useLiquidityPool()
For liquidity providers:

```typescript
const {
  // Read functions
  usePoolStats,
  useLPPositions,
  useTotalLPStake,
  usePoolConfig,
  // Write functions
  addLiquidity,
  withdrawLiquidity,
  purchaseCredits,
} = useLiquidityPool();
```

#### 3. useRedemptionOracle()
For customers and verifiers:

```typescript
const {
  // Read functions
  useRequest,
  useVerifierInfo,
  useServiceRedemptions,
  // Write functions
  requestVerification,
  verifyRedemption,
  batchVerify,
} = useRedemptionOracle();
```

## Usage Examples

### 1. Business Dashboard - Register & Create Service

```typescript
'use client';

import { useServiceCredit } from '@/hooks/useServiceCredit';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function BusinessDashboard() {
  const { address } = useAccount();
  const { registerProvider, createService, useProviderInfo, isPending } = useServiceCredit();
  const [servicePrice, setServicePrice] = useState('0.01');

  // Check if provider is registered
  const { data: providerInfo } = useProviderInfo(address);
  const isRegistered = providerInfo?.[5]; // active field

  const handleRegister = async () => {
    try {
      await registerProvider();
      alert('Successfully registered as provider!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateService = async () => {
    try {
      await createService({
        price: servicePrice, // in MNT
        expiryDays: 30,
        maxSupply: 1000,
        serviceType: 1, // haircut
      });
      alert('Service created!');
    } catch (error) {
      console.error(error);
    }
  };

  if (!isRegistered) {
    return (
      <Button onClick={handleRegister} disabled={isPending}>
        {isPending ? 'Registering...' : 'Register as Provider'}
      </Button>
    );
  }

  return (
    <div>
      <input
        type="number"
        value={servicePrice}
        onChange={(e) => setServicePrice(e.target.value)}
        placeholder="Price in MNT"
      />
      <Button onClick={handleCreateService} disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Service'}
      </Button>
    </div>
  );
}
```

### 2. Customer - Buy Service Credits

```typescript
'use client';

import { useServiceCredit } from '@/hooks/useServiceCredit';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { parseEther } from 'viem';

export function ServicePurchase({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount();
  const { mintCredit, useServiceInfo, useBalance, isPending } = useServiceCredit();

  // Get service details
  const { data: serviceInfo } = useServiceInfo(tokenId);
  const price = serviceInfo?.[0]; // price in wei

  // Get user's current balance
  const { data: balance } = useBalance(address, tokenId);

  const handlePurchase = async () => {
    if (!price) return;

    try {
      await mintCredit(tokenId, BigInt(1), price);
      alert('Credit purchased!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <p>Your balance: {balance?.toString() || '0'} credits</p>
      <p>Price: {price ? (Number(price) / 1e18).toFixed(4) : '...'} MNT</p>
      <Button onClick={handlePurchase} disabled={isPending || !price}>
        {isPending ? 'Purchasing...' : 'Buy 1 Credit'}
      </Button>
    </div>
  );
}
```

### 3. Investor - Add Liquidity

```typescript
'use client';

import { useLiquidityPool } from '@/hooks/useLiquidityPool';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function AddLiquidity() {
  const { addLiquidity, usePoolStats, isPending } = useLiquidityPool();
  const [amount, setAmount] = useState('10');
  const [lockDays, setLockDays] = useState(7);

  const { data: poolStats } = usePoolStats();
  const discountBps = poolStats?.[2]; // discount in basis points

  const handleAddLiquidity = async () => {
    try {
      await addLiquidity(amount, lockDays);
      alert('Liquidity added!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <p>Current discount: {discountBps ? Number(discountBps) / 100 : 0}%</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in MNT"
      />
      <input
        type="number"
        value={lockDays}
        onChange={(e) => setLockDays(Number(e.target.value))}
        placeholder="Lock period (days)"
      />
      <Button onClick={handleAddLiquidity} disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Liquidity'}
      </Button>
    </div>
  );
}
```

### 4. Customer - Request Redemption

```typescript
'use client';

import { useRedemptionOracle } from '@/hooks/useRedemptionOracle';
import { Button } from '@/components/ui/button';

export function RequestRedemption({ tokenId }: { tokenId: bigint }) {
  const { requestVerification, isPending } = useRedemptionOracle();

  const handleRedeem = async () => {
    // In production, this would come from QR code scan or receipt
    const proofData = `redemption-${Date.now()}-${Math.random()}`;

    try {
      const hash = await requestVerification(tokenId, BigInt(1), proofData);
      alert(`Verification requested! Transaction: ${hash}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button onClick={handleRedeem} disabled={isPending}>
      {isPending ? 'Requesting...' : 'Redeem Service'}
    </Button>
  );
}
```

## Setup Instructions

### 1. Install Dependencies (Already Done)

```bash
npm install viem wagmi @wagmi/core @wagmi/connectors @tanstack/react-query --legacy-peer-deps
```

### 2. Configure Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

Update values:
- Get WalletConnect Project ID from https://cloud.walletconnect.com
- Update contract addresses after deployment

### 3. Update Contract Addresses

After deploying contracts, update `lib/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  mantleTestnet: {
    serviceCreditToken: "0xYOUR_DEPLOYED_ADDRESS",
    liquidityPool: "0xYOUR_DEPLOYED_ADDRESS",
    redemptionOracle: "0xYOUR_DEPLOYED_ADDRESS",
    serviceFactory: "0xYOUR_DEPLOYED_ADDRESS",
  },
  // ...
};
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Testing on Mantle Testnet

### 1. Get Testnet MNT

- Visit Mantle Testnet Faucet: https://faucet.testnet.mantle.xyz
- Request testnet MNT tokens

### 2. Add Mantle Testnet to MetaMask

**Network Details:**
- Network Name: Mantle Testnet
- RPC URL: https://rpc.testnet.mantle.xyz
- Chain ID: 5003
- Currency Symbol: MNT
- Block Explorer: https://explorer.testnet.mantle.xyz

### 3. Connect Wallet

- Click "Connect Wallet" in navigation
- Select MetaMask (or WalletConnect)
- Approve connection
- Switch to Mantle Testnet if prompted

### 4. Test Transactions

1. **Register as Provider**: `/business` → Register
2. **Create Service**: Set price, expiry, supply
3. **Mint Credits**: `/customer` → Browse and purchase
4. **Add Liquidity**: `/investor` → Deposit MNT
5. **Redeem Service**: Request verification

## Transaction Monitoring

All transactions include loading states:

```typescript
const { isPending, isConfirming, isSuccess, hash } = useServiceCredit();

if (isPending) return <p>Preparing transaction...</p>;
if (isConfirming) return <p>Confirming on blockchain...</p>;
if (isSuccess) return <p>Success! TX: {hash}</p>;
```

## Error Handling

```typescript
try {
  await createService(params);
} catch (error) {
  if (error.message.includes('user rejected')) {
    alert('Transaction cancelled');
  } else if (error.message.includes('insufficient funds')) {
    alert('Insufficient MNT balance');
  } else {
    alert(`Error: ${error.message}`);
  }
}
```

## Gas Optimization Tips

- Batch operations when possible
- Use `usePoolConfig` once instead of multiple reads
- Cache service info to avoid redundant calls
- Show gas estimates before transactions

## Security Considerations

1. **Never expose private keys** in frontend code
2. **Validate all inputs** before sending transactions
3. **Check network** before contract calls
4. **Verify contract addresses** match deployment
5. **Use try/catch** for all transactions
6. **Show transaction confirmations** to users

## Next Steps

- [ ] Implement real-time event listening
- [ ] Add transaction history
- [ ] Build QR code scanner for redemptions
- [ ] Create analytics dashboard
- [ ] Add ENS support
- [ ] Implement gasless transactions (meta-transactions)

## Troubleshooting

**Issue**: Wallet not connecting
- Solution: Check if MetaMask is installed and unlocked

**Issue**: Wrong network error
- Solution: Click "Switch to Mantle" button in wallet dropdown

**Issue**: Transaction failing
- Solution: Check you have enough MNT for gas + transaction value

**Issue**: Contract address not found
- Solution: Verify contracts are deployed and addresses updated in `addresses.ts`

## Resources

- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [Mantle Docs](https://docs.mantle.xyz)
- [WalletConnect](https://cloud.walletconnect.com)
