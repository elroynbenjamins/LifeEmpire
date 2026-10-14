import { createBusiness, processBusinessWeek } from '../businessEngine';
import { getRecruitmentCooldown, getRecruitmentWaitWeeks, getSmallBusinessPayrollDiscount } from '../businessStaffingEngine';

const company = (count: number, level = 1) => ({ ...createBusiness('coffee_shop', 'Team', 1, 1, 1)!,
  level, employees: Array.from({ length: count }, (_, i) => ({ id: String(i), name: 'Worker', roleId: 'worker', weeklySalary: 260,
    skill: 50, morale: 70, buffs: [], potential: 70, experience: 0, weeksEmployed: 0, age: 25 })) as any });

test('recruitment waits scale with company level', () => {
  expect([0, 1, 2, 3, 4, 7].map(level => getRecruitmentWaitWeeks(company(3, level)))).toEqual([10, 10, 8, 6, 5, 5]);
  expect(getRecruitmentCooldown({ ...company(0), freeRecruits: 3, nextRecruitmentWeek: 20 }, 1)).toBe(0);
  expect(getRecruitmentCooldown({ ...company(3), freeRecruits: 0, nextRecruitmentWeek: 20 }, 19)).toBe(1);
});

test('small-company discount starts after three staff and is capped and tapered', () => {
  expect([3, 4, 5, 6, 10].map(n => getSmallBusinessPayrollDiscount(company(n)))).toEqual([0, 0.05, 0.10, 0.11, 0.11]);
  expect(getSmallBusinessPayrollDiscount(company(6, 3))).toBe(0.055);
  expect(getSmallBusinessPayrollDiscount(company(6, 4))).toBe(0);
  expect(getSmallBusinessPayrollDiscount({ ...company(6), typeId: 'construction_co' })).toBe(0);
});

test('weekly payroll applies the discount without rewriting employee salaries', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    const business = company(6);
    const result = processBusinessWeek(business, 1, 2, 1);
    expect(result.updatedBusiness.lastExpenseBreakdown?.salaries).toBe(Math.round(6 * 260 * 0.89 * 0.95));
    expect(business.employees.every((employee: any) => employee.weeklySalary === 260)).toBe(true);
  } finally { jest.restoreAllMocks(); }
});

test('small companies recharge at ten weeks rather than five', () => {
  const business = { ...company(3), recruitCharges: 0, recruitProgress: 4 };
  expect(processBusinessWeek(business, 1, 2, 1).updatedBusiness.recruitCharges).toBe(0);
  expect(processBusinessWeek({ ...business, recruitProgress: 9 }, 1, 2, 1).updatedBusiness.recruitCharges).toBe(1);
});

test('legacy employee requests are cleared without another popup', () => {
  const business = { ...company(3), pendingRetention: { employeeId: '0', type: 'promotion' as const } };
  expect(processBusinessWeek(business, 1, 2, 1).updatedBusiness.pendingRetention).toBeNull();
});
