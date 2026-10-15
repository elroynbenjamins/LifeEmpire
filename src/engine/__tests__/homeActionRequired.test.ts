import { getHomeRequiredActions } from '../homeActionRequired';
import type { OwnedBusiness } from '../../types/game';
type InputBusiness = Pick<OwnedBusiness,'id'|'name'|'balance'|'pendingDecision'>;

const decision = (kind: 'crisis' | 'strategy', deadlineGlobalWeek: number) => ({
  id: 'decision-1', kind, title: 'Supplier strike', description: 'Supply interruption',
  icon: 'alert', createdGlobalWeek: 35, deadlineGlobalWeek, defaultChoiceId: 'keep', choices: [],
});

describe('Home action-required priorities', () => {
  it('is completely hidden when nothing requires attention', () => {
    expect(getHomeRequiredActions({ businesses: [], cash: 10000, projectedWeeklyFlow: 1200, globalWeek: 40 })).toEqual([]);
  });
  it('surfaces expiring choices and crisis with real deadlines', () => {
    const businesses: InputBusiness[] = [
      { id: '1', name: 'Alpha', balance: 500, pendingDecision: decision('strategy', 41) },
      { id: '2', name: 'Beta', balance: 300, pendingDecision: decision('crisis', 46) },
    ];
    const result = getHomeRequiredActions({ businesses, cash: 10000, projectedWeeklyFlow: 1200, globalWeek: 40 });
    expect(result).toHaveLength(2);
    expect(result.map(item => item.urgent)).toEqual([true, true]);
    expect(result[0]).toMatchObject({ businessId: '1', focus: 'decision', route: '/business' });
    expect(result[1]).toMatchObject({ businessId: '2', focus: 'decision', route: '/business' });
    expect(result[0].detail).toBe('1 week until auto-resolution');
    expect(result[1].detail).toBe('6 weeks until auto-resolution');
  });
  it('deduplicates negative company cash when a decision also exists', () => {
    const businesses: InputBusiness[] = [
      { id: '1', name: 'Alpha', balance: -1500, pendingDecision: decision('crisis', 45) },
      { id: '2', name: 'Beta', balance: -100, pendingDecision: null },
    ];
    const result = getHomeRequiredActions({ businesses, cash: -20, projectedWeeklyFlow: -100, globalWeek: 42 });
    expect(result.map(item => item.id)).toEqual(['decision:1','business-cash:2','personal-cash']);
    expect(result.every(item => item.urgent)).toBe(true);
    expect(result[1]).toMatchObject({ businessId: '2', focus: 'cash-management', route: '/business' });
    expect(result[2]).not.toHaveProperty('businessId');
    expect(result.at(-1)?.route).toBe('/loans');
  });
  it('avoids filling the Home screen with distant routine choices', () => {
    const actions = getHomeRequiredActions({
      businesses: [
        { id: 'far', name: 'Routine', balance: 1000, pendingDecision: decision('strategy', 50) },
        { id: 'near', name: 'Deadline', balance: 1000, pendingDecision: decision('strategy', 42) },
        { id: 'critical', name: 'Risk', balance: 1000, pendingDecision: decision('crisis', 56) },
      ], cash: 5000, projectedWeeklyFlow: 100, globalWeek: 40,
    });
    expect(actions.map(action => action.businessId)).toEqual(['critical', 'near']);
    expect(actions.find(action => action.businessId === 'far')).toBeUndefined();
  });

  it('keeps financial danger visible even when the company also has a decision', () => {
    const actions = getHomeRequiredActions({
      businesses: [{ id: '7', name: 'Sigma', balance: -500, pendingDecision: decision('crisis', 44) }],
      cash: 2000, projectedWeeklyFlow: 100, globalWeek: 41,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ businessId: '7', focus: 'decision', urgent: true });
    expect(actions[0].detail).toContain('Company cash is negative');
  });

  it('warns only when next-week projected personal cash falls below zero', () => {
    const base = { businesses: [], cash: 100, projectedWeeklyFlow: -101, globalWeek: 41 };
    expect(getHomeRequiredActions(base)[0].id).toBe('cash-shortfall');
    expect(getHomeRequiredActions({ ...base, projectedWeeklyFlow: -100 })).toEqual([]);
  });
});
