/**
 * Compact Empire Cards help. No game actions are performed by the tutorial.
 * Five first-hand tips, then two contextual tips at the shop and first boss.
 */
import { currentBoss, type EmpireRun } from './empireCardsEngine';

export interface EmpireTutorialStep {
  id: string;
  title: string;
  text: string;
  focus: string;
}
export type EmpireContextTip = 'shop' | 'boss';
export type EmpireTourSection = 'intro' | EmpireContextTip | 'all';

export const EMPIRE_TUTORIAL_STEPS: readonly EmpireTutorialStep[] = [
  { id: 'goal', title: 'Clear the target to advance',
    text: 'The target is this quarter\'s growth requirement. Reach it before your hands run out to advance, earn Run Capital, and improve your deck. Miss it and the run ends.',
    focus: 'Score and quarter target' },
  { id: 'cards', title: 'Choose a scoring hand',
    text: 'You see eight cards but play up to four. Their points make your base score; matching departments unlock combinations and bigger multipliers.',
    focus: 'Your hand' },
  { id: 'preview', title: 'Plan the points you need',
    text: 'The preview shows base points, multipliers and how much remains to the target. Test options before playing so each hand moves the score meaningfully.',
    focus: 'Combination and score preview' },
  { id: 'actions', title: 'Play or replace',
    text: 'A played hand spends one of your limited turns. Discards replace weak cards without adding points, helping you find a better combination.',
    focus: 'Play Hand and Discard Mode' },
  { id: 'hint', title: 'Get advice, not answers',
    text: 'Strategy Hint suggests a route toward this target without choosing cards or spending a turn. You make every decision.',
    focus: 'Strategy Hint button' },
  { id: 'shop', title: 'Invest between quarters',
    text: 'Spend Run Capital on Advisors, combo training and deck improvements after clearing a quarter.',
    focus: 'Investment Shop (appears after clearing a quarter)' },
  { id: 'boss', title: 'Prepare for boss quarters',
    text: 'Quarters 3, 6 and 8 introduce extra conditions. Watch the warning and adjust your plan.',
    focus: 'Boss effect (appears in quarters 3, 6 and 8)' },
];

export interface EmpireTutorialProgress {
  version: 2;
  introSeen: boolean;
  shopSeen: boolean;
  bossSeen: boolean;
  disableAuto: boolean;
}

export function emptyEmpireTutorialProgress(): EmpireTutorialProgress {
  return { version: 2, introSeen: false, shopSeen: false, bossSeen: false, disableAuto: false };
}

export function readEmpireTutorialProgress(value: unknown): EmpireTutorialProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyEmpireTutorialProgress();
  const raw = value as Partial<EmpireTutorialProgress>;
  if (raw.version !== 2) return emptyEmpireTutorialProgress();
  return {
    version: 2,
    introSeen: raw.introSeen === true,
    shopSeen: raw.shopSeen === true,
    bossSeen: raw.bossSeen === true,
    disableAuto: raw.disableAuto === true,
  };
}

/** Mark only the tutorial segment actually seen. Never alter a run's state or rewards. */
export function markEmpireTutorialSeen(progress: EmpireTutorialProgress, section: EmpireTourSection): EmpireTutorialProgress {
  if (section === 'all') return { version: 2, introSeen: true, shopSeen: true, bossSeen: true, disableAuto: true };
  return { ...progress, [section === 'intro' ? 'introSeen' : section === 'shop' ? 'shopSeen' : 'bossSeen']: true };
}

export function shouldShowEmpireIntro(run: EmpireRun | null, progress: EmpireTutorialProgress): boolean {
  return !!run && !progress.disableAuto && !progress.introSeen
    && run.phase === 'play' && run.quarter === 1 && run.totalHandsPlayed === 0;
}

export function getEmpireContextTip(run: EmpireRun | null, progress: EmpireTutorialProgress): EmpireContextTip | null {
  if (!run || progress.disableAuto || !progress.introSeen) return null;
  if (run.phase === 'shop' && !progress.shopSeen) return 'shop';
  if (run.phase === 'play' && currentBoss(run) && !progress.bossSeen) return 'boss';
  return null;
}
