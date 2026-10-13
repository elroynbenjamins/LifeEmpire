import { createEmpireRun, type EmpireRun, previewEmpireHand } from '../empireCardsEngine';
import { getEmpireStrategyHint } from '../empireCardsHints';

const hand = (run: EmpireRun, ids: string[], changes: Partial<EmpireRun> = {}): EmpireRun =>
  ({ ...run, hand: ids, ...changes });

describe('Empire Cards optional strategy hints', () => {
  it('teaches first-quarter play without picking a winning combination', () => {
    const run = createEmpireRun(401);
    const original = JSON.stringify(run);
    const hint = getEmpireStrategyHint(run, 'play');
    expect(hint.title).toContain('First hand');
    expect(hint.advice).toContain('live combination');
    expect(hint.context).toContain('Play Hand');
    expect(hint).not.toHaveProperty('indices');
    expect(hint).not.toHaveProperty('selected');
    expect(JSON.stringify(run)).toBe(original);
  });

  it('explains a department opportunity without naming card positions or solving hand selection', () => {
    const run = hand(createEmpireRun(402), [
      'sales-1', 'sales-2', 'sales-3', 'operations-1', 'finance-1', 'innovation-1', 'operations-2',
    ], { quarter: 2, totalHandsPlayed: 3 });
    const hint = getEmpireStrategyHint(run, 'play');
    expect(hint.title).toContain('department');
    expect(hint.advice).toContain('Sales');
    expect(hint.advice).toContain('Specialization');
    expect(JSON.stringify(hint)).not.toMatch(/sales-[1-8]|indices|\[0|selected/);
    expect(previewEmpireHand(run, [0, 1, 2, 3]).points).toBeGreaterThan(0);
  });

  it('explains diversified opportunities without promising a best combination', () => {
    const run = hand(createEmpireRun(403), [
      'sales-1', 'operations-1', 'finance-1', 'innovation-1',
      'sales-2', 'operations-2', 'finance-2',
    ], { quarter: 2, totalHandsPlayed: 3 });
    const hint = getEmpireStrategyHint(run, 'play');
    expect(hint.title).toContain('Several combinations');
    expect(hint.advice).toContain('alternatives');
    expect(hint.context).not.toContain('highest');
  });

  it('prioritizes boss guidance and respects crisis protection', () => {
    const run = hand(createEmpireRun(404), ['sales-1', 'operations-1', 'finance-1', 'innovation-1'], {
      quarter: 3, totalHandsPlayed: 4,
      bosses: ['recession', 'tech_shift', 'inflation'],
    });
    const hint = getEmpireStrategyHint(run, 'play');
    expect(hint.title).toContain('boss');
    expect(hint.advice).toContain('Sales');
    const protectedRun = { ...run, advisors: ['crisis'] };
    expect(getEmpireStrategyHint(protectedRun, 'play').title).toContain('Advisors');
  });

  it('describes Advisor synergies without selecting or revealing an exact hand', () => {
    const run = hand(createEmpireRun(405), [
      'finance-2', 'operations-2', 'sales-2', 'sales-3', 'innovation-3',
    ], { quarter: 5, totalHandsPlayed: 5, advisors: ['venture', 'family'] });
    const hint = getEmpireStrategyHint(run, 'play');
    expect(hint.advice).toContain('Venture Capitalist');
    expect(hint.advice).toContain('Finance');
    expect(hint.context).toContain('Experiment');
  });

  it('gives discard guidance even when actions are exhausted, without suggesting specific cards', () => {
    const run = createEmpireRun(406);
    const before = JSON.stringify(run);
    const hint = getEmpireStrategyHint(run, 'discard');
    expect(hint.title).toBe('Discard with a plan');
    expect(hint.advice).toContain('Replacing');
    expect(hint.context).toContain('Choose cards');
    expect(hint).not.toHaveProperty('indices');
    expect(JSON.stringify(run)).toBe(before);
    const spent = getEmpireStrategyHint({ ...run, discardsLeft: 0 }, 'discard');
    expect(spent.advice).toContain('No discards remain');
  });
});
