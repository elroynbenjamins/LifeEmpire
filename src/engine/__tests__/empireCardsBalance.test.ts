import {
  EmpireRun, EMPIRE_QUARTERS, buyEmpireOffer, createEmpireRun, nextEmpireQuarter,
  playEmpireHand, previewEmpireHand, quarterTarget, suggestEmpireHand, trainEmpireCombo,
} from '../empireCardsEngine';

/**
 * Deterministic test bots aren't claims about human win rates.
 * They prevent accidentally creating an unwinnable late-game mode.
 */
function simulate(seed: number, style: 'basic' | 'guided' | 'strategic'): number {
  let run: EmpireRun = createEmpireRun(seed);
  let iterations = 0;
  while (iterations++ < 150 && run.phase !== 'won' && run.phase !== 'lost') {
    if (run.phase === 'play') {
      const indices = style !== 'basic' ? suggestEmpireHand(run) : [0, 1, 2, 3].filter(i => i < run.hand.length);
      run = playEmpireHand(run, indices);
      continue;
    }
    if (run.phase === 'shop') {
      if (style === 'strategic') {
        // Prioritize multiplicative Advisors and the most broadly useful base bonuses.
        const priority = ['venture', 'lab', 'family', 'trainer', 'franchise', 'lean', 'mergers', 'digital', 'logistics', 'cfo', 'brand', 'operator', 'rnd', 'tax', 'crisis'];
        const advisors = run.offers.map((offer, index) => ({ offer, index }))
          .filter(v => v.offer.kind === 'advisor' && v.offer.cost <= run.capital)
          .sort((a, b) => priority.indexOf(a.offer.id) - priority.indexOf(b.offer.id));
        if (run.advisors.length < 4 && advisors.length) {
          run = buyEmpireOffer(run, advisors[0].index);
        }
        // Build around frequent diversified hands when possible.
        if (run.capital >= 7 + (run.upgrades.diversified ?? 0) * 2)
          run = trainEmpireCombo(run, 'diversified');
      } else if (run.offers.length && run.offers[0].cost <= run.capital) {
        run = buyEmpireOffer(run, 0);
      }
      run = nextEmpireQuarter(run);
    }
  }
  return run.phase === 'won' ? 8 : Math.min(run.quarter - (run.phase === 'lost' ? 1 : 0), EMPIRE_QUARTERS.length);
}

describe('Empire Cards seeded balance benchmark', () => {
  it('compares basic play against deliberate combinations and shop decisions', () => {
    const sample = 120;
    const basic = Array(8).fill(0);
    const guided = Array(8).fill(0);
    const strategic = Array(8).fill(0);
    for (let seed = 1; seed <= sample; seed++) {
      const basicProgress = simulate(seed * 769 + 8, 'basic');
      const guidedProgress = simulate(seed * 769 + 8, 'guided');
      const strategicProgress = simulate(seed * 769 + 8, 'strategic');
      for (let quarter = 1; quarter <= 8; quarter++) {
        if (basicProgress >= quarter) basic[quarter - 1]++;
        if (guidedProgress >= quarter) guided[quarter - 1]++;
        if (strategicProgress >= quarter) strategic[quarter - 1]++;
      }
    }
    console.info('Empire Cards 120-run benchmark: quarter reach counts', { basic, guided, strategic });
    expect(strategic[0]).toBeGreaterThan(90);
    expect(strategic[1]).toBeGreaterThan(basic[1]);
    expect(guided[2]).toBeGreaterThan(basic[2]);
    expect(strategic[3]).toBeGreaterThan(0);
  });
  it('does not make the early quarter unattainable with an ordinary shuffled hand', () => {
    const example = createEmpireRun(927);
    const recommended = suggestEmpireHand(example);
    const preview = previewEmpireHand(example, recommended);
    expect(preview.points).toBeGreaterThan(150);
    expect(quarterTarget(example)).toBe(350);
  });
});
