import { getBusinessLoanOffers } from '../businessLoanOffers';
import type { OwnedBusiness } from '../../types/game';

const company = (overrides: Partial<OwnedBusiness> = {}) => ({ level: 1, valuation: 50_000, businessLoans: [], ...overrides } as OwnedBusiness);

test('starter business has three starter loans', () => {
  expect(getBusinessLoanOffers(company()).filter(o => o.available).map(o => o.amount)).toEqual([10_000, 25_000, 50_000]);
});

test('either company level or company value unlocks larger loans', () => {
  expect(getBusinessLoanOffers(company({ valuation: 500_000 })).find(o => o.amount === 100_000)?.unlocked).toBe(true);
  expect(getBusinessLoanOffers(company({ level: 7 })).every(o => o.unlocked)).toBe(true);
  expect(getBusinessLoanOffers(company({ valuation: 20_000_000 })).every(o => o.unlocked)).toBe(true);
});

test('three existing loans disable borrowing without hiding offers', () => {
  const offers = getBusinessLoanOffers(company({ level: 7, businessLoans: [{}, {}, {}] as any }));
  expect(offers).toHaveLength(9);
  expect(offers.every(o => !o.available)).toBe(true);
});

test('quotes match flat-interest store repayments including rate modifiers', () => {
  const quote = getBusinessLoanOffers(company({ level: 7 }), 0.02, 0.005).find(o => o.amount === 1_000_000)!;
  expect(quote.interestRate).toBeCloseTo(0.07);
  expect(quote.totalRepayment).toBe(1_070_000);
  expect(quote.weeklyPayment).toBe(Math.ceil(1_070_000 / 120));
  expect(getBusinessLoanOffers(company(), 1)[0].interestRate).toBe(0);
});
