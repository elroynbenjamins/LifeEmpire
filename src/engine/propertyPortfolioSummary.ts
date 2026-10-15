import type { OwnedProperty } from '../types/game';
import { inflated } from './economyEngine';
import { getPropertyWeeklyRent } from './propertyEngine';

export interface PropertyPortfolioCashFlow {
  grossRent: number;
  maintenance: number;
  netCashFlow: number;
  rentedCount: number;
}

/**
 * Current-cycle weekly property estimate, shared by the Home dashboard and
 * Real Estate. Match processProperties: maintenance applies even when vacant.
 * Forecast is indicative; next tick's inflation/cycle can change it.
 */
export function getPropertyPortfolioCashFlow(
  properties: readonly OwnedProperty[],
  inflationMultiplier: number,
  rentBonus: number,
  cycleIncomeMultiplier: number,
): PropertyPortfolioCashFlow {
  let grossRent = 0;
  let maintenance = 0;
  let rentedCount = 0;
  for (const property of properties) {
    if (property.isRentedOut) {
      rentedCount += 1;
      grossRent += getPropertyWeeklyRent(property, inflationMultiplier, rentBonus, cycleIncomeMultiplier);
    }
    maintenance += inflated(property.weeklyMaintenance ?? 0, inflationMultiplier);
  }
  return { grossRent, maintenance, netCashFlow: grossRent - maintenance, rentedCount };
}
