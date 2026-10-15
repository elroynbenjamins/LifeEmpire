import { getPropertyPortfolioCashFlow } from '../propertyPortfolioSummary';
import { getPropertyWeeklyRent } from '../propertyEngine';
import { inflated } from '../economyEngine';
import type { OwnedProperty } from '../../types/game';

const property = (id: string, isRentedOut: boolean, weeklyIncome: number, weeklyMaintenance: number): OwnedProperty =>
  ({ id, typeId: 'house', name: id, isRentedOut, weeklyIncome, weeklyMaintenance, currentValue: 125000 } as OwnedProperty);

describe('Property cash-flow consistency', () => {
  it('uses the exact rent formula from Real Estate and weekly simulation', () => {
    const properties = [property('rented', true, 1000, 180), property('vacant', false, 1500, 100)];
    const inflation = 1.23, prestige = 0.05, cycle = 0.94;
    const result = getPropertyPortfolioCashFlow(properties, inflation, prestige, cycle);
    expect(result.grossRent).toBe(getPropertyWeeklyRent(properties[0], inflation, prestige, cycle));
    expect(result.maintenance).toBe(inflated(180, inflation) + inflated(100, inflation));
    expect(result.netCashFlow).toBe(result.grossRent - result.maintenance);
    expect(result.rentedCount).toBe(1);
  });
  it('charges maintenance for vacant properties without inventing rent', () => {
    expect(getPropertyPortfolioCashFlow([property('vacant', false, 1000, 250)], 1, 0, 1)).toEqual({
      grossRent: 0, maintenance: 250, netCashFlow: -250, rentedCount: 0,
    });
  });
  it('handles no property holdings cleanly', () => {
    expect(getPropertyPortfolioCashFlow([], 1, 0, 1)).toEqual({
      grossRent: 0, maintenance: 0, netCashFlow: 0, rentedCount: 0,
    });
  });
});
