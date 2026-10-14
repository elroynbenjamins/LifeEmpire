import type { BusinessReinvestmentArea, OwnedBusiness } from '../types/game';
import { calculateValuation, getBusinessType, getUpgrade, getBusinessUpgradeWeeks } from './businessEngine';
import { BUSINESS_REINVESTMENT_AREAS, canStartBusinessReinvestment, createDefaultBusinessReinvestmentState, getBusinessReinvestmentCost, normalizeBusinessReinvestmentState } from './businessReinvestmentEngine';
import { consumeBusinessBudgetReserve } from './businessBudgetEngine';

export type BusinessBotPolicy = 'idle' | 'upkeep' | 'growth' | 'no-wear-diagnostic';
export type BusinessBotAction = { week: number; kind: 'upkeep' | 'upgrade'; target: string; cost: number };

/** Cash-only business bots. No personal injections, credit, rewards or save mutations. */
export function playBusinessBotWeek(business: OwnedBusiness, policy: BusinessBotPolicy, week: number, upgradeLimit = Infinity) {
  let next = business;
  const actions: BusinessBotAction[] = [];
  if (policy === 'idle') return { business: next, actions };
  if (policy === 'no-wear-diagnostic') {
    return { business: { ...next, reinvestment: createDefaultBusinessReinvestmentState(week) }, actions };
  }
  const reserve = Math.max(10_000, (business.lastWeekExpenses ?? 0) * 8);
  const conditions = normalizeBusinessReinvestmentState(next.reinvestment, week);
  const areas = (Object.keys(BUSINESS_REINVESTMENT_AREAS) as BusinessReinvestmentArea[])
    .sort((a, b) => conditions[a].condition - conditions[b].condition);
  const area = areas.find(area => conditions[area].condition < 75 && canStartBusinessReinvestment(next, area).allowed);
  if (area) {
    const cost = getBusinessReinvestmentCost(next, area, 1);
    if (next.balance >= cost + reserve) {
      const definition = BUSINESS_REINVESTMENT_AREAS[area];
      next = { ...next, balance: next.balance - cost,
        budgetReserves: consumeBusinessBudgetReserve(next.budgetReserves, 'reinvestment', cost),
        activeReinvestment: { area, projectName: definition.name, costPaid: cost, startedGlobalWeek: week,
          weeksRemaining: definition.weeks, totalWeeks: definition.weeks } };
      next.valuation = calculateValuation(next);
      actions.push({ week, kind: 'upkeep', target: area, cost });
    }
  }
  // Preserve cash for due maintenance rather than spend it on expansion.
  if (policy === 'growth' && next.purchasedUpgrades.length < upgradeLimit && !area && !next.activeUpgrade && !next.secondaryActiveUpgrade) {
    const type = getBusinessType(next.typeId);
    const candidates = (type?.upgrades ?? []).filter(id => !next.purchasedUpgrades.includes(id))
      .map(id => getUpgrade(id)!).filter(Boolean).sort((a, b) => a.cost - b.cost);
    const upgrade = candidates.find(item => next.balance >= item.cost + reserve);
    if (upgrade) {
      next = { ...next, balance: next.balance - upgrade.cost,
        budgetReserves: consumeBusinessBudgetReserve(next.budgetReserves, 'growth', upgrade.cost),
        activeUpgrade: { upgradeId: upgrade.id, weeksRemaining: getBusinessUpgradeWeeks() } };
      actions.push({ week, kind: 'upgrade', target: upgrade.id, cost: upgrade.cost });
    }
  }
  return { business: next, actions };
}
