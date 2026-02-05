# ServiceFi Confidential Credit Scoring iApp

A privacy-preserving credit scoring application built on iExec's Trusted Execution Environment (TEE). Business financial data is processed **confidentially** inside the TEE enclave - raw data never leaves the secure environment.

## Overview

This iApp computes credit scores for service businesses without exposing sensitive financial data:

```
┌─────────────────────────────────────────────────────────────┐
│                    TEE ENCLAVE (SGX/TDX)                     │
│                                                              │
│  INPUT (Encrypted)           OUTPUT (Public)                │
│  ├─ Monthly revenue         ├─ Credit score (0-1000)        │
│  ├─ Bank balance            ├─ Risk tier (A/B/C/D/F)        │
│  ├─ Revenue growth     →    ├─ Max credit line              │
│  ├─ Payment history         ├─ Confidence (0-100%)          │
│  ├─ Receivables days        ├─ Factor labels (not values)   │
│  └─ Business age            └─ TEE attestation              │
│                                                              │
│  Raw values NEVER leave the enclave                         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- `iapp` CLI installed (`npx @iexec/iapp-generator`)
- Docker installed
- [DockerHub](https://hub.docker.com/) account
- Ethereum wallet

### Generate Mock Data

```bash
# Generate test financial data
python scripts/generate_mock_data.py
```

### Test Locally

```bash
# Test with a single business
iapp test --args 0x742d35Cc6634C0532925a3b844Bc9e7595f5C123

# Test with custom protected data (after running generate_mock_data.py)
iapp test --args 0x742d35Cc6634C0532925a3b844Bc9e7595f5C123 --protectedData default

# Bulk processing (multiple businesses)
iapp test --protectedData data1 data2 data3
```

### Deploy on iExec

```bash
# Deploy to iExec Bellecour testnet
iapp deploy
```

### Run on iExec

```bash
# Run with protected data
iapp run <iapp-address> --args <business-address> --protectedData <protected-data-address>
```

## Credit Scoring Algorithm

### Input: Protected Financial Data

| Field | Type | Description |
|-------|------|-------------|
| `monthly_revenue` | float | Average monthly revenue (USD) |
| `revenue_growth` | float | Month-over-month growth rate |
| `bank_balance` | float | Current bank balance (USD) |
| `avg_receivables_days` | int | Average days to collect payments |
| `payment_on_time_rate` | float | On-time payment percentage (0-1) |
| `business_age_months` | int | Months in operation |
| `outstanding_invoices` | float | Total outstanding invoice value |
| `customer_count` | int | Number of unique customers |

### Output: Credit Score Result

```json
{
  "credit_score": 742,
  "risk_tier": "B",
  "max_credit_line": 150000,
  "confidence": 9200,
  "factors": {
    "revenue": "strong",
    "growth": "moderate",
    "liquidity": "excellent",
    "receivables": "good",
    "payment_history": "strong",
    "maturity": "developing",
    "diversification": "good"
  },
  "attestation": "0x8a7b3c..."
}
```

### Scoring Breakdown

| Factor | Weight | Range |
|--------|--------|-------|
| Revenue Stability | 0-200 pts | Based on monthly revenue thresholds |
| Growth Trajectory | -50 to +150 pts | Based on MoM growth rate |
| Liquidity Buffer | -75 to +150 pts | Months of runway |
| Receivables Efficiency | -50 to +100 pts | Collection speed |
| Payment History | -100 to +100 pts | On-time payment rate |
| Business Maturity | -25 to +100 pts | Time in business |
| Customer Diversification | -50 to +50 pts | Customer concentration |

### Risk Tiers

| Tier | Score Range | Max Credit Multiplier |
|------|-------------|----------------------|
| A | 800-1000 | 3x monthly revenue |
| B | 650-799 | 2x monthly revenue |
| C | 500-649 | 1x monthly revenue |
| D | 350-499 | 0.5x monthly revenue |
| F | 0-349 | No credit |

## Project Structure

```
sevicefi-exec/
├── src/
│   ├── app.py              # Main iApp entry point
│   ├── credit_scoring.py   # Scoring algorithm
│   └── protected_data.py   # iExec data deserializer
├── scripts/
│   └── generate_mock_data.py  # Test data generator
├── mock/
│   └── protectedData/      # Mock financial data
├── Dockerfile              # TEE-compatible container
├── requirements.txt        # Python dependencies
└── iapp.config.json        # iExec configuration
```

## Privacy Guarantees

1. **Data Encryption**: Financial data is encrypted before transmission
2. **TEE Processing**: Decryption and computation happen only inside SGX/TDX enclave
3. **No Raw Data Leakage**: Output contains only scores and labels, not actual values
4. **Attestation**: Cryptographic proof that computation ran inside genuine TEE

## Integration with ServiceFi

This iApp integrates with ServiceFi's smart contracts:

```solidity
// ConfidentialCreditOracle.sol calls this iApp
function requestCreditScore(
    bytes32 encryptedDatasetHash,
    address iexecApp
) external returns (bytes32 taskId);
```

The on-chain contract receives:
- `credit_score`: Used for credit line decisions
- `risk_tier`: Used for interest rate pricing
- `max_credit_line_wei`: Maximum USDC credit (6 decimals)
- `attestation`: Verified on-chain for authenticity

## Hack4Privacy Hackathon

This iApp was built for the [Hack4Privacy](https://dorahacks.io/hackathon/hack4privacy) hackathon by iExec and 50Partners.

**Track**: Confidential Real-World Assets (RWA)

**Use Case**: Privacy-preserving credit scoring for service businesses, enabling undercollateralized DeFi lending without exposing competitive financial data.

## License

MIT
