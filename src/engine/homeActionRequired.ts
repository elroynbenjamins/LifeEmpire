import type { OwnedBusiness } from '../types/game';

export type HomeAction = {
  id: string;
  title: string;
  detail: string;
  route: '/business' | '/loans';
  businessId?: string;
  focus?: 'decision' | 'cash-management';
  urgent: boolean;
};

/** Real action states only: no generic recurring warnings or fake deadlines. */
export function getHomeRequiredActions(input: {
  businesses: Pick<OwnedBusiness, 'id' | 'name' | 'balance' | 'pendingDecision'>[];
  cash: number;
  projectedWeeklyFlow: number;
  globalWeek: number;
}): HomeAction[] {
  const actions: HomeAction[] = [];
  for (const business of input.businesses) {
    const decision = business.pendingDecision;
    if (decision) {
      const left = Math.max(0, decision.deadlineGlobalWeek - input.globalWeek);
      actions.push({
        id: 'decision:' + business.id,
        title: business.name + ': ' + decision.title,
        detail: left === 0 ? 'Decision due now' : left === 1 ? '1 week until auto-resolution' : left + ' weeks until auto-resolution',
        route: '/business', businessId: business.id, focus: 'decision',
        urgent: decision.kind === 'crisis' || left <= 1,
      });
    } else if (business.balance < 0) {
      actions.push({
        id: 'business-cash:' + business.id,
        title: business.name + ' has negative company cash',
        detail: 'Review its finances and financing options',
        route: '/business', businessId: business.id, focus: 'cash-management', urgent: true,
      });
    }
  }
  if (input.cash < 0) {
    actions.push({ id: 'personal-cash', title: 'Personal cash is negative',
      detail: 'Review your bank and repayments', route: '/loans', urgent: true });
  } else if (input.cash + input.projectedWeeklyFlow < 0) {
    actions.push({ id: 'cash-shortfall', title: 'Cash may run short next week',
      detail: 'Projected cash after recurring costs is below zero', route: '/loans', urgent: true });
  }
  return actions.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
