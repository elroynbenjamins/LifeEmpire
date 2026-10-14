import { createBusiness } from '../businessEngine';
import { getBusinessRecoveryNeed, getBusinessRecoveryLoans } from '../businessRecoveryEngine';

describe('business deficit recovery', () => {
  const make = () => ({ ...createBusiness('coffee_shop', 'Recovery', 1, 1, 1)!, balance: -17_000_000, lastWeekProfit: -100_000 });

  test('covers the full deficit and four weeks of losses, not a fixed small payment', () => {
    expect(getBusinessRecoveryNeed(make())).toEqual({ shortfall: 17_000_000, weeklyBurn: 100_000, target: 17_400_000 });
    const loan = getBusinessRecoveryLoans(make())[0];
    expect(loan.kind).toBe('operating');
    expect(loan.allowed).toBe(false);
    expect(loan.reason).toBeTruthy();
    expect(loan.netCash).toBeGreaterThanOrEqual(17_400_000);
  });

  test('large companies use corporate facilities and include financing fees', () => {
    const loans = getBusinessRecoveryLoans({ ...make(), valuation: 500_000_000 });
    expect(loans.map(loan => loan.kind)).toEqual(['revolver', 'bond']);
    for (const loan of loans) {
      expect(loan.netCash).toBeGreaterThanOrEqual(17_400_000);
      if (!loan.allowed) expect(loan.reason).toBeTruthy();
    }
  });

  test('includes principal repayments without double-counting interest in profit', () => {
    const business = { ...make(), balance: -100, lastWeekProfit: -10, businessLoans: [{
      id: 'loan', amount: 1000, remainingAmount: 1100, interestRate: 0.1,
      weeklyPayment: 110, weeksRemaining: 10, durationWeeks: 10,
    }] };
    expect(getBusinessRecoveryNeed(business).weeklyBurn).toBe(110);
  });

  test('loan limit is surfaced instead of silently pretending funding succeeded', () => {
    const business = make();
    business.businessLoans = Array(3).fill({ remainingAmount: 1000, weeklyPayment: 10, interestRate: 0.1 });
    expect(getBusinessRecoveryLoans(business)[0].allowed).toBe(false);
  });
});
