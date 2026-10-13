import {
  buyEmpireOffer, createEmpireRun, EmpireRun, EMPIRE_CARDS, nextEmpireQuarter,
  playEmpireHand, retireEmpireCard, suggestEmpireHand, trainEmpireCombo,
} from '../empireCardsEngine';

type Build = 'sales' | 'operations' | 'finance' | 'innovation' | 'diversified';
const styles: Record<Build, { combo: string; advisors: string[]; focus: string | null }> = {
  sales: { combo: 'dominance', focus: 'sales', advisors: ['franchise', 'brand', 'trainer', 'logistics', 'lab', 'venture', 'operator', 'tax'] },
  operations: { combo: 'supply', focus: 'operations', advisors: ['lean', 'operator', 'logistics', 'trainer', 'venture', 'cfo', 'tax'] },
  finance: { combo: 'venture', focus: 'finance', advisors: ['venture', 'cfo', 'mergers', 'trainer', 'family', 'operator', 'tax'] },
  innovation: { combo: 'startup', focus: 'innovation', advisors: ['rnd', 'digital', 'lab', 'trainer', 'venture', 'brand', 'tax'] },
  diversified: { combo: 'diversified', focus: null, advisors: ['family', 'lab', 'venture', 'trainer', 'logistics', 'digital', 'tax'] },
};
const builds = Object.keys(styles) as Build[];

function runBuild(seed: number, build: Build): { cleared: number; won: boolean; advisers: string[] } {
  let run: EmpireRun = createEmpireRun(seed);
  const config = styles[build];
  let steps = 0;
  while (steps++ < 160 && run.phase !== 'won' && run.phase !== 'lost') {
    if (run.phase === 'play') {
      run = playEmpireHand(run, suggestEmpireHand(run));
      continue;
    }
    if (run.phase !== 'shop') break;
    // Controlled shop policy: archetypes spend on their intended business synergies
    // rather than a generic multiplier priority list.
    const possible = run.offers
      .map((offer, index) => ({ offer, index, rank: config.advisors.indexOf(offer.id) }))
      .filter(v => v.offer.kind === 'advisor' && v.rank >= 0 && run.capital >= v.offer.cost)
      .sort((a, b) => a.rank - b.rank);
    const favourite = possible[0];
    if (favourite) {
      if (run.advisors.length < 4) {
        run = buyEmpireOffer(run, favourite.index);
      } else {
        const worst = run.advisors
          .map(id => ({ id, rank: config.advisors.indexOf(id) }))
          .sort((a, b) => b.rank - a.rank)[0];
        if (worst && (worst.rank < 0 || worst.rank > favourite.rank)) {
          run = buyEmpireOffer(run, favourite.index, worst.id);
        }
      }
    }
    const cost = 7 + (run.upgrades[config.combo] ?? 0) * 2;
    if (run.capital >= cost && (run.upgrades[config.combo] ?? 0) < 4) {
      run = trainEmpireCombo(run, config.combo);
    }
    // Remove only low cards outside our specialist department, when affordable.
    // Diversified decks keep their spread; removing random departments hurts them.
    if (config.focus && run.quarter >= 3 && run.capital >= 4 + (run.retiredCards ?? 0) * 2) {
      const removable = [...run.deck, ...run.hand, ...run.discarded]
        .map(id => EMPIRE_CARDS.find(card => card.id === id)!)
        .filter(card => card && card.department !== config.focus && card.points <= 24)
        .sort((a, b) => a.points - b.points)[0];
      if (removable) run = retireEmpireCard(run, removable.id);
    }
    run = nextEmpireQuarter(run);
  }
  return { cleared: run.phase === 'won' ? 8 : run.quarter - (run.phase === 'lost' ? 1 : 0), won: run.phase === 'won', advisers: run.advisors };
}
describe('Empire Cards full-run specialization benchmark', () => {
  it('tracks five different shop strategies over the same seeded starts', () => {
    const sampleSize = 100;
    const summary = builds.map(build => {
      let wins = 0;
      let total = 0;
      const reached = Array(8).fill(0);
      for (let i = 1; i <= sampleSize; i++) {
        const outcome = runBuild(13 + i * 9973, build);
        wins += outcome.won ? 1 : 0;
        total += outcome.cleared;
        for (let q = 0; q < outcome.cleared; q++) reached[q]++;
      }
      return { build, wins, averageQuartersCleared: +(total / sampleSize).toFixed(2), reached };
    });
    console.info('Empire Cards 100-seed specialist run comparison', summary);
    for (const item of summary) {
      expect(item.reached[1]).toBeGreaterThan(60);
      expect(item.averageQuartersCleared).toBeGreaterThan(2);
      expect(item.wins).toBeGreaterThanOrEqual(0);
    }
    expect(summary).toHaveLength(5);
  });
});
