import { createEmpireRun, type EmpireRun } from '../empireCardsEngine';
import {
  EMPIRE_TUTORIAL_STEPS, emptyEmpireTutorialProgress, readEmpireTutorialProgress,
  markEmpireTutorialSeen, shouldShowEmpireIntro, getEmpireContextTip,
} from '../empireCardsTutorial';

describe('Empire Cards compact onboarding', () => {
  it('keeps exactly five short first-hand steps plus two contextual explanations', () => {
    expect(EMPIRE_TUTORIAL_STEPS).toHaveLength(7);
    expect(EMPIRE_TUTORIAL_STEPS.map(step => step.id)).toEqual([
      'goal', 'cards', 'preview', 'actions', 'hint', 'shop', 'boss',
    ]);
    for (const step of EMPIRE_TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(4);
      expect(step.text.length).toBeLessThan(165);
      expect(step.focus.length).toBeGreaterThan(4);
    }
    expect(EMPIRE_TUTORIAL_STEPS[4].text).toContain('without choosing');
  });

  it('automatically offers the first-hand tutorial once and never mutates game state', () => {
    const run = createEmpireRun(2101);
    const initial = emptyEmpireTutorialProgress();
    const snapshot = JSON.stringify(run);
    expect(shouldShowEmpireIntro(run, initial)).toBe(true);
    expect(shouldShowEmpireIntro(null, initial)).toBe(false);
    expect(shouldShowEmpireIntro({ ...run, totalHandsPlayed: 1 }, initial)).toBe(false);
    expect(shouldShowEmpireIntro({ ...run, phase: 'shop' }, initial)).toBe(false);
    expect(shouldShowEmpireIntro({ ...run, quarter: 2 }, initial)).toBe(false);
    expect(JSON.stringify(run)).toBe(snapshot);
  });

  it('skip/finish marks only intro; context tips remain available later', () => {
    const initial = emptyEmpireTutorialProgress();
    const after = markEmpireTutorialSeen(initial, 'intro');
    expect(initial.introSeen).toBe(false);
    expect(after).toEqual({ ...initial, introSeen: true });
    expect(shouldShowEmpireIntro(createEmpireRun(2102), after)).toBe(false);
    expect(getEmpireContextTip({ ...createEmpireRun(2102), phase: 'shop' }, after)).toBe('shop');
  });

  it('prompts at the first investment shop and first boss only', () => {
    const run = createEmpireRun(2103);
    const started = markEmpireTutorialSeen(emptyEmpireTutorialProgress(), 'intro');
    const shop = { ...run, phase: 'shop' as const };
    expect(getEmpireContextTip(shop, started)).toBe('shop');
    const shopViewed = markEmpireTutorialSeen(started, 'shop');
    expect(getEmpireContextTip(shop, shopViewed)).toBeNull();
    const boss: EmpireRun = { ...run, quarter: 3, phase: 'play' };
    expect(getEmpireContextTip(boss, shopViewed)).toBe('boss');
    const bossViewed = markEmpireTutorialSeen(shopViewed, 'boss');
    expect(getEmpireContextTip(boss, bossViewed)).toBeNull();
    expect(getEmpireContextTip({ ...run, quarter: 2 }, shopViewed)).toBeNull();
  });

  it('disabling automatic help suppresses all prompts without changing the run', () => {
    const run = createEmpireRun(2104);
    const disabled = markEmpireTutorialSeen(emptyEmpireTutorialProgress(), 'all');
    expect(disabled).toEqual({
      version: 1, introSeen: true, shopSeen: true, bossSeen: true, disableAuto: true,
    });
    expect(shouldShowEmpireIntro(run, disabled)).toBe(false);
    expect(getEmpireContextTip({ ...run, phase: 'shop' }, disabled)).toBeNull();
    expect(getEmpireContextTip({ ...run, quarter: 3 }, disabled)).toBeNull();
    expect(run.totalHandsPlayed).toBe(0);
  });

  it('safely reads corrupted and older tutorial data using a versioned independent profile', () => {
    const initial = emptyEmpireTutorialProgress();
    expect(readEmpireTutorialProgress(null)).toEqual(initial);
    expect(readEmpireTutorialProgress('invalid')).toEqual(initial);
    expect(readEmpireTutorialProgress([])).toEqual(initial);
    expect(readEmpireTutorialProgress({ version: 2, introSeen: true })).toEqual(initial);
    expect(readEmpireTutorialProgress({
      version: 1, introSeen: true, shopSeen: 'yes', bossSeen: 1, disableAuto: false,
    })).toEqual({ ...initial, introSeen: true });
    const stored = markEmpireTutorialSeen(markEmpireTutorialSeen(initial, 'shop'), 'intro');
    expect(readEmpireTutorialProgress(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
  });
});