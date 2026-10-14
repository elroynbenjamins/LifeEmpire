import { getBusinessLendingValue, getOperatingLoanEligibility } from './businessLendingEngine';
import type { OwnedBusiness } from '../types/game';

const BUSINESS_LOANS = [
  { amount: 10_000, rate: 0.14, weeks: 26, level: 1, value: 0 },
  { amount: 25_000, rate: 0.12, weeks: 40, level: 1, value: 0 },
  { amount: 50_000, rate: 0.10, weeks: 52, level: 1, value: 0 },
  { amount: 100_000, rate: 0.10, weeks: 60, level: 2, value: 250_000 },
  { amount: 250_000, rate: 0.095, weeks: 80, level: 3, value: 1_000_000 },
  { amount: 500_000, rate: 0.09, weeks: 100, level: 4, value: 2_500_000 },
  { amount: 1_000_000, rate: 0.085, weeks: 120, level: 5, value: 5_000_000 },
  { amount: 2_500_000, rate: 0.08, weeks: 140, level: 6, value: 10_000_000 },
  { amount: 5_000_000, rate: 0.075, weeks: 160, level: 7, value: 20_000_000 },
];

export function getBusinessLoanOffers(business: OwnedBusiness, rateReduction = 0, macroRate = 0) {
  return BUSINESS_LOANS.map(offer => {
    const unlocked = business.level >= offer.level || getBusinessLendingValue(business) >= offer.value;
    const interestRate = Math.max(0, offer.rate + macroRate - rateReduction);
    const totalRepayment = Math.round(offer.amount * (1 + interestRate));
    const eligibility = getOperatingLoanEligibility(business, offer.amount, interestRate, offer.weeks);
    return { ...offer, unlocked, interestRate, totalRepayment, reason: eligibility.reason,
      weeklyPayment: Math.ceil(totalRepayment / offer.weeks),
      available: unlocked && eligibility.allowed };
  });
}
