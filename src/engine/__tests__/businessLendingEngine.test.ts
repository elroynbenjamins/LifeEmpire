import { getBusinessLendingValue, getOperatingLoanEligibility } from '../businessLendingEngine';
import { getBusinessLoanOffers } from '../businessLoanOffers';
import { createBusiness } from '../businessEngine';

const mature = () => ({ ...createBusiness('coffee_shop', 'Test', 1, 1, 1)!, valuation: 1_000_000,
  balance: 100_000, weeklyProfitHistory: Array(12).fill(10_000), lastWeekProfit: 10_000 });

test('profitable companies can borrow within value and cash flow limits', () => {
  expect(getOperatingLoanEligibility(mature(), 100_000, 0.1, 60).allowed).toBe(true);
});
test('cash deposits do not increase lending value or offer unlocks', () => {
  const before = mature();
  const after = { ...before, balance: before.balance + 10_000_000, valuation: before.valuation + 10_000_000 };
  expect(getBusinessLendingValue(after)).toBe(getBusinessLendingValue(before));
  expect(getBusinessLoanOffers(after).map(o => o.unlocked)).toEqual(getBusinessLoanOffers(before).map(o => o.unlocked));
});
test('losses and a single profitable week cannot justify debt', () => {
  expect(getOperatingLoanEligibility({ ...mature(), lastWeekProfit: -1 }, 10_000, 0.1, 52).allowed).toBe(false);
  expect(getOperatingLoanEligibility({ ...mature(), weeklyProfitHistory: [-100, -100, -100, 200] }, 10_000, 0.1, 52).allowed).toBe(false);
});
test('existing principal and payments both constrain new loans', () => {
  const loans = [{ id: 'debt', amount: 300_000, remainingAmount: 330_000, interestRate: 0.1, weeklyPayment: 6_000, weeksRemaining: 55 }];
  expect(getOperatingLoanEligibility({ ...mature(), businessLoans: loans }, 100_000, 0.1, 60).allowed).toBe(false);
  expect(getOperatingLoanEligibility({ ...mature(), businessLoans: loans }, 50_000, 0.1, 52).allowed).toBe(false);
});
test('startup allowance is total debt, not a fresh allowance per loan', () => {
  const business = createBusiness('coffee_shop', 'Startup', 1, 1, 1)!;
  expect(getOperatingLoanEligibility(business, 50_000, 0.1, 52).allowed).toBe(true);
  expect(getOperatingLoanEligibility({ ...business, businessLoans: [{ id: 'first', amount: 50_000, remainingAmount: 55_000, interestRate: 0.1, weeklyPayment: 1058, weeksRemaining: 52 }] }, 10_000, 0.14, 26).allowed).toBe(false);
});
