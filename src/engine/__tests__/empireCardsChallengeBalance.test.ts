import {
  EmpireDifficulty, EmpireRun, createEmpireRun, buyEmpireOffer, nextEmpireQuarter,
  playEmpireHand, suggestEmpireDiscard, suggestEmpireHand, discardEmpireCards,
  previewEmpireHand, quarterTarget, trainEmpireCombo,
} from '../empireCardsEngine';

/** Conservative test pilot: values good scoring first and uses one optional discard if under pace.
 * Runs are deterministic fixtures, not human outcome estimates. */
function fly(seed: number, difficulty: EmpireDifficulty, useDiscard: boolean): number {
  let r: EmpireRun = createEmpireRun(seed, difficulty);
  let steps = 0;
  let discardUsedThisHand = false;
  while (steps++ < 175 && r.phase !== 'won' && r.phase !== 'lost') {
    if (r.phase === 'play') {
      const choice = suggestEmpireHand(r);
      const preview = previewEmpireHand(r, choice);
      const stillNeeded = Math.max(0, quarterTarget(r) - r.score);
      if (useDiscard && !discardUsedThisHand && r.discardsLeft > 0 &&
          preview.points < stillNeeded / Math.max(1, r.handsLeft)) {
        const unwanted = suggestEmpireDiscard(r);
        if (unwanted.length > 0) {
          r = discardEmpireCards(r, unwanted);
          discardUsedThisHand = true;
          continue;
        }
      }
      r = playEmpireHand(r, choice);
      discardUsedThisHand = false;
      continue;
    }
    if (r.phase === 'shop') {
      // Financial decisions are fixed across difficulty tiers; don't alter economy.
      const preference = ['venture', 'family', 'lab', 'trainer', 'logistics', 'lean', 'digital', 'brand'];
      const available = r.offers.map((offer, index) => ({ offer, index }))
        .filter(v => v.offer.kind === 'advisor' && r.capital >= v.offer.cost && preference.includes(v.offer.id))
        .sort((a, b) => preference.indexOf(a.offer.id) - preference.indexOf(b.offer.id));
      if (r.advisors.length < 4 && available.length) r = buyEmpireOffer(r, available[0].index);
      if (r.capital >= 7 + (r.upgrades.diversified ?? 0) * 2) r = trainEmpireCombo(r, 'diversified');
      r = nextEmpireQuarter(r);
      discardUsedThisHand = false;
    }
  }
  return r.phase === 'won' ? 8 : r.quarter - (r.phase === 'lost' ? 1 : 0);
}

describe('Empire Cards three-tier, discard-aware benchmarks', () => {
  it('keeps advanced difficulties an optional challenge instead of changing Standard runs', () => {
    const sample = 60;
    const counts: Record<EmpireDifficulty, number> = { standard: 0, advanced: 0, tycoon: 0 };
    const discardCounts: Record<EmpireDifficulty, number> = { standard: 0, advanced: 0, tycoon: 0 };
    for (let i = 1; i <= sample; i++) {
      const seed = i * 179 + 29;
      for (const difficulty of ['standard', 'advanced', 'tycoon'] as EmpireDifficulty[]) {
        if (fly(seed, difficulty, false) === 8) counts[difficulty]++;
        if (fly(seed, difficulty, true) === 8) discardCounts[difficulty]++;
      }
    }
    console.info('Empire Cards 60-seed difficulty and discard benchmark', { counts, discardCounts });
    expect(counts.standard).toBeGreaterThanOrEqual(counts.advanced);
    expect(counts.advanced).toBeGreaterThanOrEqual(counts.tycoon);
    expect(counts.standard).toBeGreaterThan(0);
    // Discards are optional and can preserve the best 4 cards; they should
    // not make the advanced tiers systematically impossible.
    expect(discardCounts.standard).toBeGreaterThan(0);
  });
});
