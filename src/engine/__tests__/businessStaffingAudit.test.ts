import types from '../../data/business_types.json';
import { simulateBusinessScenario } from '../businessSimulation';

const audit = process.env.BUSINESS_STAFFING_AUDIT === '1' ? test : test.skip;
audit('compares team sizes and a single paid upgrade', () => {
  const mean = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  for (const type of types) {
    const run = (employees: number, limit: number) => [203, 509, 887].map(seed => simulateBusinessScenario({
      businessTypeId: type.id, weeks: 200, seed, employeeQuality: 'average', employeeCount: employees,
      upgrades: 'none', competition: true, bot: 'growth', botUpgradeLimit: limit,
    }));
    const small = run(3, 0);
    const large = run(Math.min(6, type.maxEmployees), 0);
    const upgrade = run(3, 1);
    const benefit = upgrade.map((result, i) => result.totalProfit - small[i].totalProfit
      - result.botActions.reduce((sum, action) => sum + action.cost, 0));
    expect(upgrade.every(result => result.botActions.filter(a => a.kind === 'upgrade').length <= 1)).toBe(true);
    console.log(JSON.stringify({ type: type.id, years: 10, largerTeam: Math.min(6, type.maxEmployees),
      smallProfit: mean(small.map(r => r.totalProfit)), largeProfit: mean(large.map(r => r.totalProfit)),
      largeNeverNegative: large.filter(r => r.lowestBalance >= 0).length,
      firstUpgradeNetBenefit: mean(benefit), firstUpgradePaidBackRuns: benefit.filter(value => value >= 0).length,
    }));
  }
}, 180000);
