"""
Generate mock protected data files for testing the credit scoring iApp

Usage:
    python scripts/generate_mock_data.py

This creates ZIP files in mock/protectedData/ with borsh-serialized financial data
"""

import os
import json
import zipfile
from pathlib import Path

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent
MOCK_DIR = PROJECT_ROOT / "mock" / "protectedData"

# Sample business financial profiles
BUSINESS_PROFILES = {
    "default": {
        "name": "Acme Services LLC",
        "profile": "established_business",
        "financialData": json.dumps({
            "monthly_revenue": 75000,
            "revenue_growth": 0.12,
            "bank_balance": 180000,
            "avg_receivables_days": 28,
            "payment_on_time_rate": 0.96,
            "business_age_months": 48,
            "outstanding_invoices": 95000,
            "customer_count": 35
        })
    },
    "data1": {
        "name": "Startup Tech Co",
        "profile": "high_growth_startup",
        "financialData": json.dumps({
            "monthly_revenue": 25000,
            "revenue_growth": 0.35,
            "bank_balance": 50000,
            "avg_receivables_days": 45,
            "payment_on_time_rate": 0.92,
            "business_age_months": 14,
            "outstanding_invoices": 30000,
            "customer_count": 12
        })
    },
    "data2": {
        "name": "Local Restaurant",
        "profile": "stable_small_business",
        "financialData": json.dumps({
            "monthly_revenue": 45000,
            "revenue_growth": 0.03,
            "bank_balance": 25000,
            "avg_receivables_days": 7,
            "payment_on_time_rate": 0.99,
            "business_age_months": 72,
            "outstanding_invoices": 5000,
            "customer_count": 500
        })
    },
    "data3": {
        "name": "Struggling Retail",
        "profile": "at_risk_business",
        "financialData": json.dumps({
            "monthly_revenue": 15000,
            "revenue_growth": -0.15,
            "bank_balance": 5000,
            "avg_receivables_days": 75,
            "payment_on_time_rate": 0.72,
            "business_age_months": 36,
            "outstanding_invoices": 25000,
            "customer_count": 8
        })
    }
}


def borsh_encode_string(value: str) -> bytes:
    """
    Encode a string in borsh format
    Borsh strings: 4-byte little-endian length prefix + UTF-8 bytes
    """
    encoded = value.encode('utf-8')
    length = len(encoded).to_bytes(4, 'little')
    return length + encoded


def create_mock_protected_data(name: str, data: dict):
    """Create a mock protected data ZIP file"""
    output_path = MOCK_DIR / name

    # Create ZIP file in memory
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add financialData as borsh-encoded string
        financial_data_bytes = borsh_encode_string(data['financialData'])
        zf.writestr('financialData', financial_data_bytes)

    print(f"Created: {output_path}")

    # Also create a readable JSON version for reference
    json_path = MOCK_DIR / f"{name}.json"
    with open(json_path, 'w') as f:
        readable_data = {
            "name": data['name'],
            "profile": data['profile'],
            "financialData": json.loads(data['financialData'])
        }
        json.dump(readable_data, f, indent=2)
    print(f"Created: {json_path} (human-readable reference)")


def main():
    print("=" * 50)
    print("ServiceFi Mock Data Generator")
    print("=" * 50)

    # Ensure mock directory exists
    MOCK_DIR.mkdir(parents=True, exist_ok=True)

    # Generate mock data for each profile
    for name, data in BUSINESS_PROFILES.items():
        print(f"\nGenerating mock data for: {data['name']} ({data['profile']})")
        create_mock_protected_data(name, data)

    print("\n" + "=" * 50)
    print("Mock data generation complete!")
    print("=" * 50)
    print("\nTest commands:")
    print("  iapp test --args 0x1234...                    # Single business")
    print("  iapp test --protectedData data1 data2 data3   # Bulk processing")


if __name__ == "__main__":
    main()
