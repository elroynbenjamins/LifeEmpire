import { getOperatingLoanEligibility } from './businessLendingEngine';
import type { OwnedBusiness } from '../types/game';
import { getCorporateScaleTier } from './corporateScaleEngine';
import { getBondQuote, getRevolverDrawQuote } from './corporateFinanceEngine';
import { getBusinessWeeklyDebtService, getBusinessWeeklyInterestExpense } from './businessDebtEngine';

export function getBusinessRecoveryNeed(business: OwnedBusiness) {
  const shortfall = Math.max(0, Math.ceil(-(business.balance ?? 0)));
  const weeklyBurn = Math.max(0, -(business.lastWeekProfit ?? 0) + getBusinessWeeklyDebtService(business) - getBusinessWeeklyInterestExpense(business));
  return { shortfall, weeklyBurn, target: Math.ceil(shortfall + weeklyBurn * 4) };
}

export function getBusinessRecoveryLoans(business: OwnedBusiness, rateReduction = 0, macroRate = 0) {
  const { target } = getBusinessRecoveryNeed(business);
  const rounded = (amount: number) => Math.ceil(amount / 1000) * 1000;
  if (getCorporateScaleTier(business) === 'local') {
    const amount = rounded(Math.max(1000, target));
    const rate = Math.max(0, 0.10 + macroRate - rateReduction);
    const eligibility = getOperatingLoanEligibility(business, amount, rate, 52);
    return [{ kind: 'operating' as const, label: 'Business loan', amount, netCash: amount,
      interestRate: rate, durationWeeks: 52, weeklyPayment: Math.ceil(Math.round(amount * (1 + rate)) / 52),
      allowed: eligibility.allowed,
      reason: eligibility.reason }];
  }
  return ([
    { kind: 'revolver' as const, label: 'Corporate credit line', fee: 0.005, quote: getRevolverDrawQuote },
    { kind: 'bond' as const, label: 'Corporate bond', fee: 0.0075, quote: getBondQuote },
  ]).map(({ kind, label, fee, quote }) => {
    const result = quote(business, rounded(Math.max(1000, target) / (1 - fee)), rateReduction, macroRate);
    return { ...result, kind, label, netCash: result.debtPrincipal - result.arrangementFee };
  });
}
