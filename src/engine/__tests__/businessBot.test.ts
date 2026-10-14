import businessTypes from '../../data/business_types.json';
import { createBusiness, getUpgrade } from '../businessEngine';
import { playBusinessBotWeek, BusinessBotPolicy } from '../businessBot';
import { simulateBusinessScenario } from '../businessSimulation';
import { getBusinessReinvestmentCost, getBusinessReinvestmentEffects } from '../businessReinvestmentEngine';

test('disabled upkeep never charges or schedules a refresh', () => {
  const business = createBusiness('coffee_shop', 'Bot', 1, 1, 1)!;
  business.balance = 200_000;
  business.reinvestment!.technology.condition = 60;
  const result = playBusinessBotWeek(business, 'upkeep', 50);
  expect(result.actions).toHaveLength(0);
  expect(result.business.balance).toBe(200_000);
  expect(result.business.activeReinvestment).toBeFalsy();
  expect(business.balance).toBe(200_000);
  expect(business.activeReinvestment).toBeFalsy();
});

test('growth bot pays for an upgrade and cannot grant instant completion', () => {
  const business = { ...createBusiness('coffee_shop', 'Bot', 1, 1, 1)!, balance: 200_000 };
  const result = playBusinessBotWeek(business, 'growth', 2);
  expect(result.actions[0].kind).toBe('upgrade');
  expect(result.business.balance).toBe(200_000 - getUpgrade(result.actions[0].target)!.cost);
  expect(result.business.purchasedUpgrades).toEqual([]);
  expect(result.business.activeUpgrade!.weeksRemaining).toBeGreaterThan(0);
});

test('bots never purchase beyond available cash', () => {
  const business = createBusiness('coffee_shop', 'Bot', 1, 1, 1)!;
  business.reinvestment!.equipment.condition = 0;
  expect(playBusinessBotWeek(business, 'growth', 100).actions).toEqual([]);
});

test('diagnostic isolates condition penalties without charging maintenance', () => {
  const business = createBusiness('coffee_shop', 'Bot', 1, 1, 1)!;
  business.reinvestment!.equipment.condition = 0;
  const result = playBusinessBotWeek(business, 'no-wear-diagnostic', 100);
  expect(getBusinessReinvestmentEffects(result.business).revenuePenalty).toBe(0);
  expect(result.business.balance).toBe(business.balance);
});

const audit = process.env.BUSINESS_BOT_AUDIT === '1' ? test : test.skip;
audit('compares business bots over twenty game years', () => {
  for (const type of businessTypes.map(type => type.id)) {
    for (const bot of ['idle', 'growth'] as BusinessBotPolicy[]) {
      const results = [11, 29, 47].map(seed => simulateBusinessScenario({ businessTypeId: type,
        bot, weeks: 400, seed, upgrades: 'none', employeeQuality: 'average', competition: true }));
      const mean = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      console.log(JSON.stringify({ type, bot, runs: results.length,
        neverNegative: results.filter(r => r.lowestBalance >= 0).length,
        profit: mean(results.map(r => r.totalProfit)),
        spending: mean(results.map(r => r.botActions.reduce((sum, action) => sum + action.cost, 0))),
        endingCash: mean(results.map(r => r.endingBalance)),
        upgrades: mean(results.map(r => r.endingBusiness.purchasedUpgrades.length)),
        actions: mean(results.map(r => r.botActions.length)),
      }));
    }
  }
}, 120000);
