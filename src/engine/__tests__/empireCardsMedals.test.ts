import {
  EMPIRE_ACHIEVEMENTS, EMPIRE_CHALLENGES, applyEmpireMedalProgress, emptyEmpireMedals,
  readEmpireMedals, reconcileEmpireMedals, activeEmpireChallenge, empireChallengeProgress,
} from '../empireCardsMedals';
import {
  createEmpireRun, discardEmpireCards, playEmpireHand, nextEmpireQuarter, buyEmpireOffer,
  isEmpireRun, quarterTarget, type EmpireRun,
} from '../empireCardsEngine';

const ventureCards = ['sales-1', 'sales-2', 'finance-1', 'finance-2'];
const diversifiedCards = ['sales-1', 'operations-1', 'finance-1', 'innovation-1'];
const hand = (run: EmpireRun, cards: string[], overrides: Partial<EmpireRun> = {}): EmpireRun =>
  ({ ...run, hand: cards, ...overrides });

describe('Empire Cards: medals and optional run challenges', () => {
  it('defines 12 achievable non-currency achievements and four optional challenges', () => {
    expect(EMPIRE_ACHIEVEMENTS).toHaveLength(12);
    expect(EMPIRE_CHALLENGES).toHaveLength(4);
    expect(new Set(EMPIRE_ACHIEVEMENTS.map(m => m.id)).size).toBe(12);
    expect(new Set(EMPIRE_CHALLENGES.map(c => c.id)).size).toBe(4);
    for (const entry of [...EMPIRE_ACHIEVEMENTS, ...EMPIRE_CHALLENGES]) {
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.icon).toBeTruthy();
      expect(entry.description.toLowerCase()).not.toMatch(/gem|coins|money reward/);
    }
  });

  it('keeps medals in a separate, sanitized save-slot profile', () => {
    const original = emptyEmpireMedals();
    const value = { version: 1, unlocked: ['first_hand', 'first_hand', 'undefined', 99],
      completedChallenges: ['venture_trio', 'venture_trio', 'not_a_challenge'] };
    expect(readEmpireMedals(value)).toEqual({
      version: 1, unlocked: ['first_hand'], completedChallenges: ['venture_trio'],
    });
    expect(readEmpireMedals(null)).toEqual(original);
    expect(readEmpireMedals({ version: 99 })).toEqual(original);
    expect(readEmpireMedals([])).toEqual(original);
  });

  it('tracks repeated Joint Ventures without introducing run currency rewards', () => {
    const init = createEmpireRun(51, 'standard', 'venture_trio');
    expect(activeEmpireChallenge(init)?.target).toBe(3);
    let current = hand(init, ventureCards, { quarter: 7, handsLeft: 4 });
    const cashBefore = current.capital;
    for (let count = 1; count <= 3; count++) {
      current = playEmpireHand(current, [0, 1, 2, 3]);
      expect(empireChallengeProgress(current)).toBe(count);
      expect(current.challengeCompleted).toBe(count === 3);
      if (count !== 3) current = hand(current, ventureCards);
    }
    expect(current.capital).toBe(cashBefore);
    expect(isEmpireRun(JSON.parse(JSON.stringify(current)))).toBe(true);
  });

  it('tracks Diversified Empire hands independently from Joint Ventures', () => {
    let current = hand(createEmpireRun(62, 'standard', 'diversified_four'), diversifiedCards, {
      quarter: 8, score: 0, handsLeft: 6, // constructed fixture isolates combo counting from round loss.
    });
    for (let count = 1; count <= 4; count++) {
      current = playEmpireHand(current, [0, 1, 2, 3]);
      expect(empireChallengeProgress(current)).toBe(count);
      if (count !== 4) current = hand(current, diversifiedCards);
    }
    expect(current.challengeCompleted).toBe(true);
  });

  it('awards Clean Audit only for clearing a boss quarter without discarding there', () => {
    const first = createEmpireRun(73, 'standard', 'clean_boss');
    const boss = hand(first, diversifiedCards, { quarter: 3, bosses: ['recession', 'inflation', 'tech_shift'],
      score: quarterTarget({ ...first, quarter: 3, bosses: ['recession', 'inflation', 'tech_shift'] }) - 1 });
    const completed = playEmpireHand(boss, [0, 1, 2, 3]);
    expect(completed.phase).toBe('shop');
    expect(completed.challengeCompleted).toBe(true);
    let used = discardEmpireCards(hand(boss, diversifiedCards), [0]);
    expect(used.quarterUsedDiscard).toBe(true);
    used = playEmpireHand(hand(used, diversifiedCards), [0, 1, 2, 3]);
    expect(used.challengeCompleted).toBe(false);
    const followingQuarter = nextEmpireQuarter(completed);
    expect(followingQuarter.quarterUsedDiscard).toBe(false);
  });

  it('requires a completed run without any discards for No Safety Net', () => {
    const init = createEmpireRun(84, 'standard', 'no_discards');
    const last = hand(init, diversifiedCards, { quarter: 8, score: quarterTarget({ ...init, quarter: 8 }) - 1 });
    expect(playEmpireHand(last, [0, 1, 2, 3]).challengeCompleted).toBe(true);
    const discarded = discardEmpireCards(last, [0]);
    expect(discarded.usedAnyDiscard).toBe(true);
    expect(playEmpireHand(hand(discarded, diversifiedCards), [0, 1, 2, 3]).challengeCompleted).toBe(false);
  });

  it('only awards achievements after valid gameplay and keeps rewards as medals', () => {
    const init = createEmpireRun(95);
    const before = emptyEmpireMedals();
    expect(applyEmpireMedalProgress(before, init, init)).toBe(before);
    const played = playEmpireHand(hand(init, diversifiedCards), [0, 1, 2, 3]);
    const earned = applyEmpireMedalProgress(before, init, played);
    expect(earned.unlocked).toContain('first_hand');
    expect(earned.unlocked).toContain('diversified');
    expect(earned.unlocked).not.toContain('champion');
    expect(applyEmpireMedalProgress(earned, init, played)).toBe(earned);
    const firstClear = playEmpireHand(hand(init, diversifiedCards, { score: quarterTarget(init) - 1 }), [0,1,2,3]);
    const quarterMedals = applyEmpireMedalProgress(before, init, firstClear);
    expect(quarterMedals.unlocked).toContain('first_quarter');
    const tycoon = createEmpireRun(96, 'tycoon', 'no_discards');
    const last = hand(tycoon, diversifiedCards, { quarter: 8, score: quarterTarget({ ...tycoon, quarter: 8 }) - 1 });
    const victory = playEmpireHand(last, [0,1,2,3]);
    const victoryMedals = applyEmpireMedalProgress(before, last, victory);
    expect(victoryMedals.unlocked).toEqual(expect.arrayContaining(['first_hand', 'champion', 'tycoon', 'boss']));
    expect(victoryMedals.completedChallenges).toEqual(['no_discards']);
    expect(victory.capital).toBe(0);
  });

  it('recognizes full advisor roster and does not award medals on rejected offers', () => {
    const start = createEmpireRun(107);
    const shop: EmpireRun = { ...start, phase: 'shop', capital: 50,
      advisors: ['brand', 'cfo', 'operator'],
      offers: [{kind:'advisor',id:'rnd',cost:5}] };
    const ignored = buyEmpireOffer(shop, 7);
    expect(applyEmpireMedalProgress(emptyEmpireMedals(), shop, ignored).unlocked).toHaveLength(0);
    const bought = buyEmpireOffer(shop, 0);
    expect(applyEmpireMedalProgress(emptyEmpireMedals(), shop, bought).unlocked).toContain('full_team');
  });

  it('reconciles provable older save milestones without inventing historic hands', () => {
    const won = { ...createEmpireRun(118, 'tycoon'), quarter: 8, phase: 'won' as const };
    const restored = reconcileEmpireMedals(emptyEmpireMedals(), won);
    expect(restored.unlocked).toEqual(expect.arrayContaining(['champion', 'tycoon', 'first_quarter']));
    expect(restored.unlocked).not.toContain('joint_venture');
    expect(reconcileEmpireMedals(restored, won)).toBe(restored);
    const standard = createEmpireRun(119);
    const legacy = { ...standard } as Record<string, unknown>;
    delete legacy.challengeId;
    delete legacy.challengeProgress;
    delete legacy.challengeCompleted;
    expect(isEmpireRun(legacy)).toBe(true);
  });
});