import type { WeekSummary } from '../../types/game';
import { getWeeklyCashFlowSummary } from '../weeklyCashFlowSummary';

const weekly = (fields: Partial<WeekSummary>) => fields as WeekSummary;

describe('Tracked weekly cash-flow calculation', () => {
  it('includes net property income and dividends without double-counting maintenance', () => {
    const result = getWeeklyCashFlowSummary(weekly({
      salaryEarned: 1800, partnerContribution: 200, dividendIncome: 50,
      propertyIncome: 400, rentPaid: 600, foodCost: 100, taxAmount: 150,
    }));
    expect(result).toEqual({ income: 2450, expenses: 700, tax: 150, net: 1600 });
  });
  it('treats vacant-property maintenance as an outflow', () => {
    const result = getWeeklyCashFlowSummary(weekly({
      propertyIncome: -250, salaryEarned: 1300, utilityCost: 100, taxAmount: 0,
    }));
    expect(result).toEqual({ income: 1300, expenses: 350, tax: 0, net: 950 });
  });
  it('does not fabricate income on a quiet week', () => {
    expect(getWeeklyCashFlowSummary(weekly({}))).toEqual({
      income: 0, expenses: 0, tax: 0, net: 0,
    });
  });
});
