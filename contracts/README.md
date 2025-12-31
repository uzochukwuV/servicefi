# ServiceFi Smart Contracts

Gas-optimized smart contracts for tokenizing prepaid service credits on Mantle Network.

## Architecture

### Core Contracts

1. **ServiceCreditToken.sol** - ERC1155 token representing service credits
   - Provider registration and management
   - Service creation with expiry dates
   - Credit minting with instant provider payment
   - Oracle-based redemption
   - Gas-optimized structs (max 6 fields)

2. **LiquidityPool.sol** - DeFi liquidity pool for discounted credit purchases
   - LP deposits with time-locked positions
   - Discounted bulk purchases of service credits
   - Yield distribution to liquidity providers
   - Gas-optimized with minimal storage

3. **RedemptionOracle.sol** - Off-chain verification oracle
   - Decentralized verifier network
   - Reputation-based access control
   - Batch verification support
   - Timeout-based request expiry

4. **ServiceFactory.sol** - Factory for deploying complete ecosystems
   - One-click deployment of all contracts
   - Deployment fee collection
   - Ecosystem tracking

## Gas Optimization Features

All contracts follow strict gas optimization principles:

- ✅ **Structs limited to 8 fields** (prevents stack overflow)
- ✅ **Variable packing** (uint128/uint64/uint32/uint8 types)
- ✅ **Immutable variables** for frequently accessed addresses
- ✅ **Batch operations** with gas limit protection
- ✅ **Event-based indexing** instead of storage
- ✅ **ERC1155** for efficient multi-token operations

See [GAS_OPTIMIZATION.md](./GAS_OPTIMIZATION.md) for detailed documentation.

## Installation

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
npm install

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts
```

## Testing

```bash
# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-test testMintCredit

# Run with verbosity
forge test -vvv
```

### Gas Benchmarks

Expected gas usage on Mantle Network:

| Operation | Gas Cost | USD (@ 1 gwei, $1 MNT) |
|-----------|----------|------------------------|
| Register Provider | ~45,000 | ~$0.045 |
| Create Service | ~75,000 | ~$0.075 |
| Mint 1 Credit | ~120,000 | ~$0.12 |
| Redeem Credit | ~45,000 | ~$0.045 |
| Add Liquidity | ~80,000 | ~$0.08 |

## Deployment

### Environment Setup

Create `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
MANTLE_RPC_URL=https://rpc.mantle.xyz
MANTLE_EXPLORER_API_KEY=your_explorer_api_key
```

### Deploy to Mantle Testnet

```bash
# Deploy all contracts
forge script scripts/Deploy.s.sol:Deploy \
  --rpc-url mantle_testnet \
  --broadcast \
  --verify

# Deployment addresses saved to ./deployments/mantle.env
```

### Deploy to Mantle Mainnet

```bash
forge script scripts/Deploy.s.sol:Deploy \
  --rpc-url mantle \
  --broadcast \
  --verify \
  --slow  # Use for mainnet to avoid nonce issues
```

## Usage Examples

### For Service Providers

```solidity
// 1. Register as provider
serviceCreditToken.registerProvider();

// 2. Create a service (e.g., haircut)
uint256 tokenId = serviceCreditToken.createService(
    0.01 ether,              // Price: $10 equivalent
    block.timestamp + 30 days, // Expires in 30 days
    1000,                     // Max 1000 credits
    1                         // Service type: haircut
);

// 3. Customers mint credits - you get paid instantly!
```

### For Customers

```solidity
// Buy service credits
serviceCreditToken.mintCredit{value: 0.01 ether}(tokenId, 1);

// Request redemption (off-chain QR code scan)
bytes32 requestId = redemptionOracle.requestVerification(
    tokenId,
    1,
    proofHash
);

// Verifier approves -> credit burned, service delivered
```

### For Liquidity Providers

```solidity
// Add liquidity for yield
liquidityPool.addLiquidity{value: 10 ether}(30 days);

// Pool manager purchases credits at 10% discount
// e.g., $90 paid for $100 face value credits

// Withdraw after lock period with yield
liquidityPool.withdrawLiquidity(positionIndex);
```

## Contract Addresses

### Mantle Testnet
```
ServiceFactory: TBD
ServiceCreditToken: TBD
LiquidityPool: TBD
RedemptionOracle: TBD
```

### Mantle Mainnet
```
Coming soon...
```

## Security

### Audits
- [ ] Internal audit completed
- [ ] External audit pending
- [ ] Bug bounty program TBD

### Security Features
- ReentrancyGuard on all payable functions
- AccessControl for oracle verifiers
- Owner-only admin functions
- Expiry-based automatic cleanup
- No custody of physical assets
- No reliance on price oracles

### Known Limitations
1. **Trust in Verifiers**: Redemption requires trusted oracle verifiers
2. **Expiry Enforcement**: Expired tokens must be manually swept
3. **Provider Honoring**: Assumes providers honor redemptions

## Integration

### Frontend Integration

```typescript
import { ethers } from 'ethers';

// Connect to ServiceCreditToken
const sct = new ethers.Contract(
  SERVICE_CREDIT_TOKEN_ADDRESS,
  ServiceCreditTokenABI,
  signer
);

// Mint credits
await sct.mintCredit(tokenId, amount, { value: totalCost });

// Check balance
const balance = await sct.balanceOf(userAddress, tokenId);
```

### Oracle Integration

Verifiers run off-chain service to:
1. Monitor for `VerificationRequested` events
2. Verify proof (QR code, receipt, etc.)
3. Call `verifyRedemption()` on-chain

Example verifier setup:
```typescript
oracle.on('VerificationRequested', async (requestId, tokenId, user) => {
  // Check proof off-chain
  const isValid = await checkServiceDelivery(requestId);

  // Submit verification
  await oracle.verifyRedemption(requestId, isValid);
});
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`forge test`)
4. Check gas reports (`forge test --gas-report`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file

## Resources

- [ServiceFi Documentation](https://docs.servicefi.io)
- [Mantle Network](https://www.mantle.xyz/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Support

- Discord: [ServiceFi Community](https://discord.gg/servicefi)
- Twitter: [@ServiceFi](https://twitter.com/servicefi)
- Email: dev@servicefi.io
