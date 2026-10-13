import {
  createEmpireRun, EMPIRE_COMBOS, EMPIRE_DIFFICULTIES,
  suggestEmpireDiscard, suggestEmpireHand, quarterTarget, isEmpireRun,
  buyEmpireOffer, nextEmpireQuarter, playEmpireHand,
} from '../empireCardsEngine';

describe('Empire Cards optional challenges and fair shop limits', () => {
  it('supports Standard, Advanced and Tycoon without changing the main run structure', () => {
    const standard = createEmpireRun(2026, 'standard');
    const advanced = createEmpireRun(2026, 'advanced');
    const tycoon = createEmpireRun(2026, 'tycoon');
    expect(Object.keys(EMPIRE_DIFFICULTIES)).toEqual(['standard', 'advanced', 'tycoon']);
    expect(quarterTarget(standard)).toBe(350);
    expect(quarterTarget(advanced)).toBe(392);
    expect(quarterTarget(tycoon)).toBe(438);
    expect(standard.hand).toEqual(tycoon.hand);
    expect(standard.bosses).toEqual(advanced.bosses);
    expect(isEmpireRun(tycoon)).toBe(true);
  });

  it('reads existing saves as Standard and rejects corrupt difficulty values safely', () => {
    const standard = createEmpireRun(123);
    const oldSave = { ...standard } as Record<string, unknown>;
    delete oldSave.difficulty;
    expect(isEmpireRun(oldSave)).toBe(true);
    expect(quarterTarget(oldSave as unknown as ReturnType<typeof createEmpireRun>)).toBe(350);
    expect(isEmpireRun({ ...standard, difficulty: null })).toBe(false);
    expect(isEmpireRun({ ...standard, difficulty: 'impossible' })).toBe(false);
  });

  it('combines boss inflation with selected difficulty and carries difficulty into later quarters', () => {
    const t = createEmpireRun(937, 'tycoon');
    const run = { ...t, quarter: 3, bosses: ['inflation', 'recession', 'anti_trust'] };
    expect(quarterTarget(run)).toBe(Math.ceil(730 * 1.2 * 1.25));
    const cleared = playEmpireHand({ ...t, score: quarterTarget(t) - 1 }, [0]);
    const advanced = nextEmpireQuarter(cleared);
    expect(advanced.difficulty).toBe('tycoon');
    expect(advanced.quarter).toBe(2);
    expect(quarterTarget(advanced)).toBe(Math.ceil(520 * 1.25));
  });

  it('suggests replaceable cards without spending discards or losing strong cards', () => {
    const run = createEmpireRun(911);
    const selected = suggestEmpireDiscard(run);
    const chosen = suggestEmpireHand(run);
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.length).toBeLessThanOrEqual(3);
    expect(selected.every(index => !chosen.includes(index))).toBe(true);
    expect(new Set(selected).size).toBe(selected.length);
    expect(run.discardsLeft).toBe(2);
    expect(suggestEmpireDiscard({ ...run, discardsLeft: 0 })).toEqual([]);
    expect(suggestEmpireDiscard({ ...run, hand: run.hand.slice(0, 4) })).toEqual([]);
  });

  it('prevents random shop upgrades from exceeding the same four-level training cap', () => {
    const run = createEmpireRun(741);
    const combo = EMPIRE_COMBOS[0];
    const shop = {
      ...run, phase: 'shop' as const, capital: 30,
      offers: [{ kind: 'upgrade' as const, id: combo.id, cost: 6 }],
      upgrades: { [combo.id]: 4 },
    };
    expect(buyEmpireOffer(shop, 0)).toBe(shop);
    const ready = { ...shop, upgrades: { [combo.id]: 3 } };
    expect(buyEmpireOffer(ready, 0).upgrades[combo.id]).toBe(4);
  });
});
