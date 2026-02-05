"""
ServiceFi Confidential Credit Scoring Algorithm
Runs inside iExec TEE - raw financial data never leaves the enclave
"""

from dataclasses import dataclass
from typing import Tuple
from enum import IntEnum


class RiskTier(IntEnum):
    """Risk classification tiers"""
    A = 0  # Excellent - lowest risk
    B = 1  # Good - low risk
    C = 2  # Fair - moderate risk
    D = 3  # Poor - high risk
    F = 4  # Fail - rejected


@dataclass
class FinancialData:
    """Business financial data structure (protected data input)"""
    monthly_revenue: float          # Average monthly revenue in USD
    revenue_growth: float           # Month-over-month growth rate (-1 to +inf)
    bank_balance: float             # Current bank balance in USD
    avg_receivables_days: int       # Average days to collect receivables
    payment_on_time_rate: float     # Percentage of on-time payments (0-1)
    business_age_months: int        # Months in business
    outstanding_invoices: float     # Total outstanding invoice value
    customer_count: int             # Number of unique customers


@dataclass
class CreditScoreResult:
    """Output structure - only this leaves the TEE"""
    score: int                      # 0-1000 credit score
    risk_tier: RiskTier             # A/B/C/D/F classification
    max_credit_line: float          # Maximum recommended credit in USD
    confidence: int                 # Model confidence 0-10000 (basis points)
    factors: dict                   # Contributing factors (no raw values)


def validate_financial_data(data: dict) -> FinancialData:
    """Validate and parse financial data input"""
    required_fields = [
        'monthly_revenue', 'revenue_growth', 'bank_balance',
        'avg_receivables_days', 'payment_on_time_rate', 'business_age_months'
    ]

    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    return FinancialData(
        monthly_revenue=float(data.get('monthly_revenue', 0)),
        revenue_growth=float(data.get('revenue_growth', 0)),
        bank_balance=float(data.get('bank_balance', 0)),
        avg_receivables_days=int(data.get('avg_receivables_days', 45)),
        payment_on_time_rate=float(data.get('payment_on_time_rate', 0)),
        business_age_months=int(data.get('business_age_months', 0)),
        outstanding_invoices=float(data.get('outstanding_invoices', 0)),
        customer_count=int(data.get('customer_count', 1))
    )


def calculate_credit_score(data: FinancialData) -> CreditScoreResult:
    """
    Calculate credit score from financial data

    Algorithm runs entirely inside TEE - only aggregated results are output.
    Raw financial values (revenue, balance, etc.) NEVER leave the enclave.
    """
    score = 500  # Base score
    factors = {}
    confidence = 10000  # Start at 100% confidence

    # === REVENUE STABILITY (0-200 points) ===
    if data.monthly_revenue > 100000:
        score += 200
        factors['revenue'] = 'excellent'
    elif data.monthly_revenue > 50000:
        score += 150
        factors['revenue'] = 'strong'
    elif data.monthly_revenue > 20000:
        score += 100
        factors['revenue'] = 'good'
    elif data.monthly_revenue > 10000:
        score += 50
        factors['revenue'] = 'fair'
    elif data.monthly_revenue > 5000:
        score += 25
        factors['revenue'] = 'developing'
    else:
        score -= 50
        factors['revenue'] = 'insufficient'
        confidence -= 1000  # Lower confidence for low revenue

    # === GROWTH TRAJECTORY (−50 to +150 points) ===
    if data.revenue_growth > 0.20:  # >20% growth
        score += 150
        factors['growth'] = 'rapid'
    elif data.revenue_growth > 0.10:  # >10% growth
        score += 100
        factors['growth'] = 'strong'
    elif data.revenue_growth > 0.05:  # >5% growth
        score += 50
        factors['growth'] = 'moderate'
    elif data.revenue_growth >= 0:  # Stable
        score += 25
        factors['growth'] = 'stable'
    elif data.revenue_growth > -0.10:  # Slight decline
        score -= 25
        factors['growth'] = 'declining'
    else:  # >10% decline
        score -= 50
        factors['growth'] = 'concerning'
        confidence -= 500

    # === LIQUIDITY BUFFER (0-150 points) ===
    if data.monthly_revenue > 0:
        months_runway = data.bank_balance / data.monthly_revenue
    else:
        months_runway = 0

    if months_runway > 6:
        score += 150
        factors['liquidity'] = 'excellent'
    elif months_runway > 3:
        score += 100
        factors['liquidity'] = 'strong'
    elif months_runway > 1:
        score += 50
        factors['liquidity'] = 'adequate'
    elif months_runway > 0.5:
        score += 0
        factors['liquidity'] = 'tight'
    else:
        score -= 75
        factors['liquidity'] = 'critical'
        confidence -= 1500

    # === RECEIVABLES EFFICIENCY (−50 to +100 points) ===
    if data.avg_receivables_days < 15:
        score += 100
        factors['receivables'] = 'excellent'
    elif data.avg_receivables_days < 30:
        score += 75
        factors['receivables'] = 'strong'
    elif data.avg_receivables_days < 45:
        score += 50
        factors['receivables'] = 'good'
    elif data.avg_receivables_days < 60:
        score += 0
        factors['receivables'] = 'average'
    elif data.avg_receivables_days < 90:
        score -= 25
        factors['receivables'] = 'slow'
    else:
        score -= 50
        factors['receivables'] = 'problematic'
        confidence -= 500

    # === PAYMENT HISTORY (−100 to +100 points) ===
    if data.payment_on_time_rate >= 0.98:
        score += 100
        factors['payment_history'] = 'excellent'
    elif data.payment_on_time_rate >= 0.95:
        score += 75
        factors['payment_history'] = 'strong'
    elif data.payment_on_time_rate >= 0.90:
        score += 50
        factors['payment_history'] = 'good'
    elif data.payment_on_time_rate >= 0.80:
        score += 0
        factors['payment_history'] = 'fair'
    elif data.payment_on_time_rate >= 0.70:
        score -= 50
        factors['payment_history'] = 'concerning'
    else:
        score -= 100
        factors['payment_history'] = 'poor'
        confidence -= 2000

    # === BUSINESS MATURITY (−25 to +100 points) ===
    if data.business_age_months >= 60:  # 5+ years
        score += 100
        factors['maturity'] = 'established'
    elif data.business_age_months >= 36:  # 3+ years
        score += 75
        factors['maturity'] = 'mature'
    elif data.business_age_months >= 24:  # 2+ years
        score += 50
        factors['maturity'] = 'developing'
    elif data.business_age_months >= 12:  # 1+ year
        score += 25
        factors['maturity'] = 'young'
    elif data.business_age_months >= 6:  # 6+ months
        score += 0
        factors['maturity'] = 'startup'
    else:
        score -= 25
        factors['maturity'] = 'new'
        confidence -= 1000  # New businesses have less predictable performance

    # === CUSTOMER CONCENTRATION (−50 to +50 points) ===
    if data.customer_count >= 50:
        score += 50
        factors['diversification'] = 'excellent'
    elif data.customer_count >= 20:
        score += 25
        factors['diversification'] = 'good'
    elif data.customer_count >= 10:
        score += 0
        factors['diversification'] = 'moderate'
    elif data.customer_count >= 5:
        score -= 25
        factors['diversification'] = 'concentrated'
    else:
        score -= 50
        factors['diversification'] = 'high_risk'
        confidence -= 500

    # === CLAMP SCORE ===
    score = max(0, min(1000, score))
    confidence = max(0, min(10000, confidence))

    # === DETERMINE RISK TIER ===
    risk_tier = classify_risk_tier(score)

    # === CALCULATE MAX CREDIT LINE ===
    max_credit_line = calculate_max_credit_line(score, data, risk_tier)

    return CreditScoreResult(
        score=score,
        risk_tier=risk_tier,
        max_credit_line=max_credit_line,
        confidence=confidence,
        factors=factors  # Only descriptive labels, no raw values
    )


def classify_risk_tier(score: int) -> RiskTier:
    """Classify score into risk tier"""
    if score >= 800:
        return RiskTier.A
    elif score >= 650:
        return RiskTier.B
    elif score >= 500:
        return RiskTier.C
    elif score >= 350:
        return RiskTier.D
    else:
        return RiskTier.F


def calculate_max_credit_line(score: int, data: FinancialData, risk_tier: RiskTier) -> float:
    """
    Calculate maximum recommended credit line

    Based on score, monthly revenue, and risk tier.
    Uses conservative multipliers to limit exposure.
    """
    if risk_tier == RiskTier.F:
        return 0  # No credit for F tier

    # Base: percentage of monthly revenue
    base_multipliers = {
        RiskTier.A: 3.0,   # Up to 3 months revenue
        RiskTier.B: 2.0,   # Up to 2 months revenue
        RiskTier.C: 1.0,   # Up to 1 month revenue
        RiskTier.D: 0.5,   # Up to 0.5 months revenue
    }

    multiplier = base_multipliers.get(risk_tier, 0)

    # Score modifier: 0.5x to 1.5x based on score within tier
    score_modifier = 0.5 + (score / 1000)  # 0.5 at score 0, 1.5 at score 1000

    # Calculate base credit line
    credit_line = data.monthly_revenue * multiplier * score_modifier

    # Cap at outstanding invoices + bank balance (collateral proxy)
    collateral_cap = data.outstanding_invoices * 0.8 + data.bank_balance * 0.5

    # Apply minimum and maximum bounds
    credit_line = min(credit_line, collateral_cap)
    credit_line = max(credit_line, 0)

    # Round to nearest 100
    return round(credit_line / 100) * 100


def compute_bulk_scores(financial_data_list: list) -> list:
    """
    Process multiple businesses in bulk
    Returns list of credit score results
    """
    results = []
    for i, data_dict in enumerate(financial_data_list):
        try:
            financial_data = validate_financial_data(data_dict)
            result = calculate_credit_score(financial_data)
            results.append({
                'index': i,
                'success': True,
                'score': result.score,
                'risk_tier': result.risk_tier.name,
                'max_credit_line': result.max_credit_line,
                'confidence': result.confidence,
                'factors': result.factors
            })
        except Exception as e:
            results.append({
                'index': i,
                'success': False,
                'error': str(e)
            })

    return results
