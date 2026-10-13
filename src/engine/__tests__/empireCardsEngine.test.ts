import {
  EMPIRE_ADVISORS, EMPIRE_BOSSES, EMPIRE_CARDS, EMPIRE_COMBOS, EMPIRE_QUARTERS,
  EmpireRun, buyEmpireOffer, createEmpireRun, currentBoss, discardEmpireCards,
  findEmpireCombo, isEmpireRun, nextEmpireQuarter, playEmpireHand,
  previewEmpireHand, quarterTarget, rerollEmpireShop,
} from '../empireCardsEngine';

const card = (id: string) => EMPIRE_CARDS.find(c => c.id === id)!;
const withHand = (ids: string[], extras: Partial<EmpireRun> = {}): EmpireRun => ({
  ...createEmpireRun(1123), hand: ids, ...extras,
});

describe('Empire Cards - fixed content contract', () => {
  it('ships 32 distinct starter cards across four equal departments', () => {
    expect(EMPIRE_CARDS).toHaveLength(32);
    expect(new Set(EMPIRE_CARDS.map(c => c.id)).size).toBe(32);
    for (const department of ['sales', 'operations', 'finance', 'innovation']) {
      expect(EMPIRE_CARDS.filter(c => c.department === department)).toHaveLength(8);
    }
    expect(EMPIRE_ADVISORS).toHaveLength(15);
    expect(EMPIRE_COMBOS).toHaveLength(8);
    expect(EMPIRE_QUARTERS).toHaveLength(8);
    expect(EMPIRE_BOSSES).toHaveLength(6);
  });

  it.each([
    ['dominance', ['sales-1', 'sales-2', 'sales-3', 'sales-4']],
    ['diversified', ['sales-1', 'operations-1', 'finance-1', 'innovation-1']],
    ['venture', ['sales-1', 'sales-2', 'finance-1', 'finance-2']],
    ['specialization', ['sales-1', 'sales-2', 'sales-3', 'finance-1']],
    ['supply', ['operations-1', 'operations-2', 'sales-1', 'finance-1']],
    ['startup', ['innovation-1', 'innovation-2', 'sales-1', 'finance-1']],
    ['expansion', ['sales-1', 'sales-2', 'operations-1', 'innovation-1']],
    ['partnership', ['sales-1', 'sales-2', 'finance-1', 'innovation-1']],
  ])('identifies %s', (id, hand) => {
    expect(findEmpireCombo((hand as string[]).map(card))?.id).toBe(id);
  });

  it('begins a 32-card run with 7 drawn cards and deterministic seeded order', () => {
    const run = createEmpireRun(12345);
    expect(run.quarter).toBe(1);
    expect(run.hand).toHaveLength(7);
    expect(run.deck).toHaveLength(25);
    expect(run.handsLeft).toBe(3);
    expect(run.discardsLeft).toBe(2);
    expect(run.capital).toBe(0);
    expect(run).toEqual(createEmpireRun(12345));
    expect(isEmpireRun(JSON.parse(JSON.stringify(run)))).toBe(true);
    expect(isEmpireRun({ version: 1, deck: ['bad-id'] })).toBe(false);
  });

  it('uses 3 selected boss quarters from six unique potential conditions', () => {
    const run = createEmpireRun(3);
    expect(run.bosses).toHaveLength(3);
    expect(new Set(run.bosses).size).toBe(3);
    expect(currentBoss(run)).toBeNull();
    expect(currentBoss({ ...run, quarter: 3 })?.id).toBe(run.bosses[0]);
    expect(currentBoss({ ...run, quarter: 6 })?.id).toBe(run.bosses[1]);
    expect(currentBoss({ ...run, quarter: 8 })?.id).toBe(run.bosses[2]);
  });

  it('computes base, combinations, Advisors and boss penalties together', () => {
    const hand = ['sales-1', 'sales-2', 'finance-1', 'innovation-1'];
    const base = previewEmpireHand(withHand(hand), [0, 1, 2, 3]);
    const advisor = previewEmpireHand(withHand(hand, { advisors: ['brand'] }), [0, 1, 2, 3]);
    expect(advisor.base - base.base).toBe(20);
    expect(advisor.points).toBeGreaterThan(base.points);
    const recession = previewEmpireHand(withHand(hand, { quarter: 3, bosses: ['recession', 'inflation', 'regulation'] }), [0, 1, 2, 3]);
    expect(recession.points).toBeLessThan(base.points);
    const protectedRun = previewEmpireHand(withHand(hand, { quarter: 3, bosses: ['recession', 'inflation', 'regulation'], advisors: ['crisis'] }), [0, 1, 2, 3]);
    expect(protectedRun.points).toBe(base.points);
  });

  it('applies the inflation boss target and limits antitrust multipliers', () => {
    const run = withHand(['sales-1', 'sales-2', 'sales-3', 'sales-4'], { quarter: 3, bosses: ['inflation', 'recession', 'anti_trust'] });
    expect(quarterTarget(run)).toBe(Math.ceil(EMPIRE_QUARTERS[2].target * 1.2));
    const antiTrust = { ...run, bosses: ['anti_trust', 'recession', 'inflation'] };
    expect(previewEmpireHand(antiTrust, [0, 1, 2, 3]).multiplier).toBe(2.25);
    expect(previewEmpireHand({ ...antiTrust, advisors: ['crisis'] }, [0, 1, 2, 3]).multiplier).toBe(3.5);
  });

  it('discards up to four cards while keeping a full hand and preserving immutability', () => {
    const run = createEmpireRun(451);
    const original = JSON.stringify(run);
    const next = discardEmpireCards(run, [0, 1, 2, 3]);
    expect(next.discardsLeft).toBe(1);
    expect(next.hand).toHaveLength(7);
    expect(JSON.stringify(run)).toBe(original);
    expect(discardEmpireCards(next, [0, 0])).toBe(next);
    expect(discardEmpireCards({ ...next, discardsLeft: 0 }, [0])).toHaveProperty('discardsLeft', 0);
  });

  it('clears a quarter, buys a shop upgrade, rerolls, and advances without spending main-game cash', () => {
    const run = createEmpireRun(875);
    const wonQuarter = playEmpireHand({ ...run, score: quarterTarget(run) - 1 }, [0]);
    expect(wonQuarter.phase).toBe('shop');
    expect(wonQuarter.capital).toBeGreaterThan(0);
    expect(wonQuarter.offers.some(o => o.kind === 'upgrade')).toBe(true);
    const upgradeIndex = wonQuarter.offers.findIndex(o => o.kind === 'upgrade');
    const upgraded = buyEmpireOffer(wonQuarter, upgradeIndex);
    expect(Object.values(upgraded.upgrades)).toContain(1);
    expect(upgraded.capital).toBeLessThan(wonQuarter.capital);
    const rerolled = rerollEmpireShop(upgraded);
    expect(rerolled.capital).toBe(upgraded.capital - 2);
    const next = nextEmpireQuarter(rerolled);
    expect(next.quarter).toBe(2);
    expect(next.phase).toBe('play');
    expect(next.score).toBe(0);
    expect(next.hand).toHaveLength(7);
    expect(next.handsLeft).toBe(3);
  });

  it('ends on failure and completes after eight successful quarters', () => {
    const run = createEmpireRun(998);
    const failed = playEmpireHand({ ...run, handsLeft: 1 }, [0]);
    expect(failed.phase).toBe('lost');
    expect(playEmpireHand(failed, [0])).toBe(failed);
    const last: EmpireRun = { ...run, quarter: 8, score: quarterTarget({ ...run, quarter: 8 }) - 1 };
    expect(playEmpireHand(last, [0]).phase).toBe('won');
  });

  it('rejects invalid actions', () => {
    const run = createEmpireRun(568);
    expect(playEmpireHand(run, [])).toBe(run);
    expect(playEmpireHand(run, [0, 0])).toBe(run);
    expect(playEmpireHand(run, [99])).toBe(run);
    expect(discardEmpireCards(run, [0, 0])).toBe(run);
    expect(buyEmpireOffer(run, 0)).toBe(run);
    expect(nextEmpireQuarter(run)).toBe(run);
  });
});
