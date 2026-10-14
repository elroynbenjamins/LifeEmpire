import businessTypes from '../../data/business_types.json';
import { simulateBusinessScenario } from '../businessSimulation';

const audit = process.env.BUSINESS_RELEASE_AUDIT === '1' ? test : test.skip;
audit('fresh-seed pre-release business simulation', () => {
  const seeds = [203, 509, 887, 1231, 2027];
  for (const years of [5, 10, 20]) {
    for (const bot of ['idle', 'growth'] as const) {
      const rows = businessTypes.flatMap(type => seeds.map(seed => {
        const result = simulateBusinessScenario({ businessTypeId: type.id, seed, bot,
          weeks: years * 20, upgrades: 'none', employeeQuality: 'average', competition: true });
        const spending = result.botActions.reduce((sum, action) => sum + action.cost, 0);
        expect([result.totalProfit, result.endingBalance, result.endingValuation, result.lowestBalance].every(Number.isFinite)).toBe(true);
        expect(result.botActions.every(action => action.cost > 0)).toBe(true);
        expect(result.botActions.some(action => action.kind === 'upkeep')).toBe(false);
        expect(new Set(result.endingBusiness.purchasedUpgrades).size).toBe(result.endingBusiness.purchasedUpgrades.length);
        return { type: type.id, seed, cash: Math.round(result.endingBalance),
          low: Math.round(result.lowestBalance), profit: Math.round(result.totalProfit),
          netAfterUpgrades: Math.round(result.totalProfit - spending), spending,
          upgrades: result.endingBusiness.purchasedUpgrades.length };
      }));
      console.log(JSON.stringify({ years, bot, runs: rows.length,
        neverNegative: rows.filter(r => r.low >= 0).length,
        positiveOperatingProfit: rows.filter(r => r.profit > 0).length,
        positiveAfterUpgradeCosts: rows.filter(r => r.netAfterUpgrades > 0).length,
        fullyUpgraded: rows.filter(r => r.upgrades === 5).length,
        shortfalls: rows.filter(r => r.low < 0),
        weakestNet: [...rows].sort((a, b) => a.netAfterUpgrades - b.netAfterUpgrades).slice(0, 3),
      }));
    }
  }
}, 180000);
