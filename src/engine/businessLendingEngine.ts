import type { OwnedBusiness } from '../types/game';
import { getBusinessDebtPrincipal, getBusinessWeeklyDebtService, getBusinessWeeklyInterestExpense } from './businessDebtEngine';

// Cash deposits and loan proceeds must not create new operating collateral.
export function getBusinessLendingValue(business: OwnedBusiness) {
  return Math.max(0, (business.valuation ?? 0) - Math.max(0, business.balance ?? 0));
}

export function getOperatingLoanEligibility(business: OwnedBusiness, amount: number, rate: number, weeks: number) {
  const weeklyPayment = Math.ceil(Math.round(amount * (1 + rate)) / weeks);
  const debt = getBusinessDebtPrincipal(business);
  const history = (business.weeklyProfitHistory ?? []).filter(Number.isFinite).slice(-12);
  const startup = history.length < 4 && (business.lastWeekProfit ?? 0) >= 0 && (business.balance ?? 0) >= 0;
  const capacity = startup ? 50_000 : Math.max(50_000, getBusinessLendingValue(business) * 0.40);
  const lastOperatingCash = (business.lastWeekProfit ?? 0) + Math.max(0,
    business.lastExpenseBreakdown?.loanInterest ?? getBusinessWeeklyInterestExpense(business));
  // Historical net profit is conservative: do not add today's interest to old weeks.
  const average = history.length ? history.reduce((sum, profit) => sum + profit, 0) / history.length : 0;
  const sustainableCash = Math.max(0, Math.min(lastOperatingCash, average));
  let reason: string | null = null;
  if (![amount, rate, weeks].every(Number.isFinite) || amount <= 0 || rate < 0 || weeks <= 0) reason = 'Invalid loan terms.';
  else if ((business.businessLoans?.length ?? 0) >= 3) reason = 'Maximum 3 active operating loans reached.';
  else if (debt + amount > capacity) reason = 'Total borrowing exceeds the company operating-value debt limit. Add owner or holding funds instead.';
  else if (!startup && (history.length < 4 || sustainableCash <= 0)) reason = 'Build at least four weeks of positive average cash flow before borrowing. Use owner or holding funds for recovery.';
  else if (!startup && getBusinessWeeklyDebtService(business) + weeklyPayment > sustainableCash * 0.65) reason = 'Combined repayments would exceed 65% of sustainable weekly cash flow. Choose a smaller loan or add owner funds.';
  return { allowed: reason === null, reason, weeklyPayment, capacity, sustainableCash };
}
