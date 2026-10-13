import {
  EMPIRE_ADVISORS, EMPIRE_CARDS, createEmpireRun, previewEmpireHand, suggestEmpireHand,
} from '../empireCardsEngine';

/** Diagnostic sample over seeded mixed hands + each planned combination.
 * These are simulation metrics, not observed player win rates. */
describe('Empire Cards advisor scoring audit', () => {
  it('reports the marginal score impact of every Advisor across realistic and tailored hands', () => {
    const patterns = [
      ['sales-6','sales-7','sales-8','sales-5'],
      ['sales-7','operations-7','finance-7','innovation-7'],
      ['sales-8','sales-6','finance-8','finance-6'],
      ['sales-8','sales-7','sales-6','finance-7'],
      ['operations-8','operations-6','sales-7','finance-6'],
      ['innovation-8','innovation-6','sales-7','finance-6'],
      ['sales-8','sales-6','operations-8','innovation-7'],
      ['operations-8','operations-6','finance-8','innovation-6'],
    ];
    const samples: { hand: string[]; quarter: number; boss: string | null }[] = [];
    // Best four from randomized seven-card hands represent normal play.
    for (let seed = 1; seed <= 180; seed++) {
      const run = createEmpireRun(seed * 104729);
      const chosen = suggestEmpireHand(run);
      samples.push({ hand: chosen.map(i => run.hand[i]), quarter: 1, boss: null });
    }
    // Crafted hands ensure rarer combinations and boss answers are measured.
    for (const hand of patterns) {
      for (const boss of [null,'recession','supply_crisis','regulation','tech_shift','anti_trust','inflation']) {
        samples.push({ hand, quarter: boss ? 3 : 1, boss });
      }
    }
    const report = EMPIRE_ADVISORS.map(advisor => {
      let gain = 0; let maxGain = 0; let active = 0; let baseTotal = 0;
      for (const sample of samples) {
        const run = { ...createEmpireRun(33), quarter: sample.quarter,
          hand: sample.hand, bosses: [sample.boss ?? 'recession','regulation','inflation'] };
        const selection = [0,1,2,3];
        const original = previewEmpireHand(run, selection).points;
        const modified = previewEmpireHand({ ...run, advisors: [advisor.id] }, selection).points;
        const delta = modified - original;
        baseTotal += original;
        gain += delta;
        maxGain = Math.max(maxGain, delta);
        if (delta > 0) active++;
      }
      return {
        id: advisor.id,
        rarity: advisor.rarity,
        meanGainPct: Number((gain / baseTotal * 100).toFixed(1)),
        activationPct: Number((active / samples.length * 100).toFixed(1)),
        maxGain,
      };
    });
    console.info('Empire Cards 15-Advisor balance audit', report);
    expect(EMPIRE_ADVISORS).toHaveLength(15);
    expect(new Set(EMPIRE_ADVISORS.map(a => a.id)).size).toBe(15);
    expect(samples.length).toBe(236);
    expect(EMPIRE_CARDS.length).toBe(32);
  });

  it('makes five different archetypes rewarding in their intended deck patterns', () => {
    const patterns = [
      { name: 'Sales', hand: ['sales-5','sales-6','sales-7','sales-8','finance-8','operations-8','innovation-8'], advisors: ['franchise','brand','trainer','logistics'], minPoints: 750 },
      { name: 'Operations', hand: ['operations-5','operations-6','operations-7','operations-8','finance-8','sales-8','innovation-8'], advisors: ['operator','lean','trainer','logistics'], minPoints: 650 },
      { name: 'Finance', hand: ['finance-5','finance-6','finance-7','finance-8','operations-8','sales-8','innovation-8'], advisors: ['venture','cfo','trainer','mergers'], minPoints: 700 },
      { name: 'Innovation', hand: ['innovation-5','innovation-6','innovation-7','innovation-8','operations-8','finance-8','sales-8'], advisors: ['rnd','digital','trainer','lab'], minPoints: 700 },
      { name: 'Diversified', hand: ['sales-8','operations-8','finance-8','innovation-8','sales-7','finance-7','innovation-7'], advisors: ['family','lab','digital','trainer'], minPoints: 700 },
    ];
    const report: { name: string; score: number; generic: number; combo: string | undefined }[] = [];
    for (const pattern of patterns) {
      const sample = { ...createEmpireRun(711), hand: pattern.hand, advisors: pattern.advisors };
      const chosen = suggestEmpireHand(sample);
      const score = previewEmpireHand(sample, chosen);
      const genericRun = { ...sample, advisors: ['brand','operator','cfo','rnd'] };
      const generic = previewEmpireHand(genericRun, suggestEmpireHand(genericRun));
      report.push({ name: pattern.name, score: score.points, generic: generic.points, combo: score.combo?.name });
      expect(score.points).toBeGreaterThan(pattern.minPoints);
      expect(score.points).toBeGreaterThan(generic.points * 1.2);
    }
    console.info('Empire Cards specialist build showcase', report);
    expect(report).toHaveLength(5);
  });
});