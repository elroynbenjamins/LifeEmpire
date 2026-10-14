import { createBusiness, getBusinessRevenueCapacity } from '../businessEngine';
import type { BusinessEmployee } from '../../types/game';

test('five percent productivity bonus scales employee output without changing salary', () => {
  const business = createBusiness('coffee_shop', 'Test', 1, 1, 1)!;
  const employee = { id: 'worker', roleId: 'worker', skill: 50, morale: 50, weeklySalary: 260, buffs: [] } as unknown as BusinessEmployee;
  const staffed = { ...business, employees: [employee, { ...employee, id: 'two' }, { ...employee, id: 'three' }] };
  const productivity = 3 * (0.4 + 0.5 * 0.8) * (0.5 + 0.5 * 0.7);
  expect(getBusinessRevenueCapacity(staffed) / getBusinessRevenueCapacity(business))
    .toBeCloseTo((0.4 + productivity * 1.05 * 0.14) / 0.4);
  expect(staffed.employees.reduce((sum, worker) => sum + worker.weeklySalary, 0)).toBe(780);
});
