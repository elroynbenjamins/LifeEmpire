import { simulateBusinessScenario } from '../businessSimulation';
import types from '../../data/business_types.json';
import upgrades from '../../data/business_upgrades.json';
import { getUpgrade } from '../businessEngine';

// Opt-in audit: businesses run unattended, with constant prices and prepaid upgrades.
const audit = process.env.BUSINESS_LONGEVITY_AUDIT === '1' ? test : test.skip;
audit('reports 5, 10 and 20 game-year survival and upgrade returns', () => {
  const seeds = [11, 29, 47, 83, 101];
  const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  for (const years of [5, 10, 20]) {
    const rows = types.map(type => {
      const cost = upgrades.filter(upgrade => type.upgrades.includes(upgrade.id)).reduce((sum, upgrade) => sum + getUpgrade(upgrade.id)!.cost, 0);
      const run = (loadout: 'none' | 'all') => seeds.map(seed => simulateBusinessScenario({
        businessTypeId: type.id, weeks: years * 20, seed, employeeQuality: 'average', employeeCount: 3,
        upgrades: loadout, startingBalance: type.startupCost, competition: true,
      }));
      const base = run('none');
      const improved = run('all');
      return {
        name: type.name,
        neverNegative: base.filter(result => result.lowestBalance >= 0).length,
        upgradedNeverNegative: improved.filter(result => result.lowestBalance >= 0).length,
        profit: Math.round(median(base.map(result => result.totalProfit))),
        upgradedProfit: Math.round(median(improved.map(result => result.totalProfit))),
        upgradeNetBenefit: Math.round(median(improved.map((result, i) => result.totalProfit - base[i].totalProfit - cost))),
        upgradeCost: cost,
        endingWeeklyProfit: Math.round(median(base.map(result => result.endingBusiness.lastWeekProfit))),
        upgradedEndingWeeklyProfit: Math.round(median(improved.map(result => result.endingBusiness.lastWeekProfit))),
        level: median(base.map(result => result.endingBusiness.level)),
        upgradedLevel: median(improved.map(result => result.endingBusiness.level)),
        remainingEmployees: median(base.map(result => result.endingBusiness.employees.length)),
      };
    });
    console.log(JSON.stringify({ years, seeds: seeds.length, rows }));
    expect(rows.every(row => Number.isFinite(row.profit))).toBe(true);
  }
}, 120000);
