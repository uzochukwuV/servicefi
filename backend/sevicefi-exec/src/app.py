"""
ServiceFi Confidential Credit Scoring iApp
==========================================
Runs inside iExec TEE (SGX/TDX) - raw financial data NEVER leaves the enclave.

Inputs:
  - args: [business_address] - Ethereum address of the business being scored
  - protected data: JSON financial data (encrypted, decrypted only in TEE)
  - requester secret 1: API key for additional verification (optional)
  - app secret: Model version/parameters (set by app owner)

Outputs:
  - credit_score: 0-1000
  - risk_tier: A/B/C/D/F
  - max_credit_line: USD amount
  - confidence: 0-10000 (basis points)
  - factors: Descriptive labels (no raw values exposed)
  - attestation: TEE proof hash
"""

import json
import os
import sys
import hashlib
from datetime import datetime, timezone
import protected_data
from credit_scoring import (
    validate_financial_data,
    calculate_credit_score
)

# iExec environment
IEXEC_OUT = os.getenv('IEXEC_OUT', '/iexec_out')
IEXEC_IN = os.getenv('IEXEC_IN', '/iexec_in')

# Result tracking
computed_json = {}


def generate_attestation(business_address: str, score: int, timestamp: str) -> str:
    """Generate TEE attestation hash for on-chain verification"""
    attestation_data = f"{business_address}:{score}:{timestamp}:servicefi-credit-v1"
    return hashlib.sha256(attestation_data.encode()).hexdigest()


def get_protected_value(path: str, schema: str, bulk_index: int | None = None):
    """Wrapper to handle optional bulk_index parameter"""
    if bulk_index is not None:
        return protected_data.getValue(path, schema, bulk_index)
    return protected_data.getValue(path, schema)


def parse_financial_data_from_protected(bulk_index: int | None = None) -> dict:
    """
    Parse financial data from protected data
    Protected data contains JSON with financial fields
    """
    try:
        # Try to get financial data as JSON string
        financial_json = get_protected_value('financialData', 'string', bulk_index)
        return json.loads(financial_json)
    except Exception:
        # Fallback: try to get individual fields
        try:
            return {
                'monthly_revenue': get_protected_value('monthlyRevenue', 'f64', bulk_index),
                'revenue_growth': get_protected_value('revenueGrowth', 'f64', bulk_index),
                'bank_balance': get_protected_value('bankBalance', 'f64', bulk_index),
                'avg_receivables_days': int(get_protected_value('avgReceivablesDays', 'i128', bulk_index)),
                'payment_on_time_rate': get_protected_value('paymentOnTimeRate', 'f64', bulk_index),
                'business_age_months': int(get_protected_value('businessAgeMonths', 'i128', bulk_index)),
                'outstanding_invoices': get_protected_value('outstandingInvoices', 'f64', bulk_index),
                'customer_count': int(get_protected_value('customerCount', 'i128', bulk_index))
            }
        except Exception as e:
            raise ValueError(f"Failed to parse financial data: {e}")


def process_single_business(business_address: str, financial_data: dict) -> dict:
    """Process credit scoring for a single business"""
    timestamp = datetime.now(timezone.utc).isoformat()

    # Validate and compute score
    validated_data = validate_financial_data(financial_data)
    result = calculate_credit_score(validated_data)

    # Generate attestation
    attestation = generate_attestation(business_address, result.score, timestamp)

    return {
        'business_address': business_address,
        'credit_score': result.score,
        'risk_tier': result.risk_tier.name,
        'risk_tier_value': int(result.risk_tier),
        'max_credit_line': result.max_credit_line,
        'max_credit_line_wei': int(result.max_credit_line * 1e6),  # USDC decimals
        'confidence': result.confidence,
        'factors': result.factors,
        'timestamp': timestamp,
        'attestation': attestation,
        'model_version': 'servicefi-credit-v1'
    }


def main():
    global computed_json

    try:
        print("=" * 60)
        print("ServiceFi Confidential Credit Scoring")
        print("Running inside iExec TEE - Data Protected")
        print("=" * 60)

        # === PARSE ARGUMENTS ===
        args = sys.argv[1:]
        print(f"\nReceived {len(args)} arguments")

        business_address = args[0] if len(args) > 0 else "0x0000000000000000000000000000000000000000"
        print(f"Business address: {business_address}")

        # === CHECK APP SECRET (Model Configuration) ===
        app_secret = os.getenv("IEXEC_APP_DEVELOPER_SECRET")
        if app_secret:
            print("App secret loaded (model configuration)")
        else:
            print("Using default model configuration")

        # === CHECK REQUESTER SECRET (Optional API Key) ===
        api_key = os.getenv("IEXEC_REQUESTER_SECRET_1")
        if api_key:
            print("Requester API key provided")
        else:
            print("No additional API verification")

        # === PROCESS PROTECTED DATA ===
        bulk_size = int(os.getenv("IEXEC_BULK_SLICE_SIZE", "0"))
        results = []

        if bulk_size > 0:
            # Bulk processing: multiple businesses
            print(f"\nProcessing {bulk_size} businesses in bulk...")

            for i in range(1, bulk_size + 1):
                try:
                    print(f"\n--- Business {i}/{bulk_size} ---")
                    financial_data = parse_financial_data_from_protected(i)
                    print(f"Financial data loaded for business {i}")

                    # Use index as address if not provided
                    addr = business_address if i == 1 else f"bulk_business_{i}"
                    result = process_single_business(addr, financial_data)
                    results.append(result)

                    print(f"Score: {result['credit_score']} | Tier: {result['risk_tier']}")

                except Exception as e:
                    print(f"Error processing business {i}: {e}")
                    results.append({
                        'index': i,
                        'success': False,
                        'error': str(e)
                    })
        else:
            # Single business processing
            print("\nProcessing single business...")
            try:
                financial_data = parse_financial_data_from_protected()
                print("Financial data loaded from protected data")

                result = process_single_business(business_address, financial_data)
                results.append(result)

                print(f"\nCredit Score: {result['credit_score']}")
                print(f"Risk Tier: {result['risk_tier']}")
                print(f"Max Credit Line: ${result['max_credit_line']:,.2f}")
                print(f"Confidence: {result['confidence'] / 100:.1f}%")

            except Exception as e:
                print(f"Error processing business: {e}")
                results.append({
                    'success': False,
                    'error': str(e)
                })

        # === WRITE OUTPUT ===
        print("\n" + "=" * 60)
        print("Writing results (raw financial data NOT included)")
        print("=" * 60)

        output_data = {
            'version': '1.0.0',
            'model': 'servicefi-credit-v1',
            'processed_at': datetime.now(timezone.utc).isoformat(),
            'bulk_processing': bulk_size > 0,
            'results': results
        }

        # Write detailed JSON result
        result_path = os.path.join(IEXEC_OUT, 'credit-score-result.json')
        with open(result_path, 'w') as f:
            json.dump(output_data, f, indent=2)

        # Write summary for quick access
        if len(results) == 1 and 'credit_score' in results[0]:
            summary = results[0]
            summary_path = os.path.join(IEXEC_OUT, 'summary.txt')
            with open(summary_path, 'w') as f:
                f.write(f"ServiceFi Credit Score Report\n")
                f.write(f"{'=' * 40}\n")
                f.write(f"Business: {summary['business_address']}\n")
                f.write(f"Score: {summary['credit_score']}/1000\n")
                f.write(f"Risk Tier: {summary['risk_tier']}\n")
                f.write(f"Max Credit: ${summary['max_credit_line']:,.2f}\n")
                f.write(f"Confidence: {summary['confidence'] / 100:.1f}%\n")
                f.write(f"Attestation: 0x{summary['attestation']}\n")
                f.write(f"\nFactors:\n")
                for factor, rating in summary['factors'].items():
                    f.write(f"  - {factor}: {rating}\n")

        computed_json = {'deterministic-output-path': result_path}
        print(f"\nResults written to: {result_path}")
        print("SUCCESS: Credit scoring completed")

    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

        computed_json = {
            'deterministic-output-path': IEXEC_OUT,
            'error-message': f'Credit scoring failed: {str(e)}'
        }

    finally:
        # Always write computed.json for iExec
        computed_path = os.path.join(IEXEC_OUT, 'computed.json')
        with open(computed_path, 'w') as f:
            json.dump(computed_json, f)
        print(f"\ncomputed.json written to: {computed_path}")


if __name__ == "__main__":
    main()
