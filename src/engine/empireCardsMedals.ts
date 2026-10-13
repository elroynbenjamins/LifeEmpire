/**
 * Empire Cards' entirely self-contained badge cabinet.
 * No gems, main-game cash, PP, other currencies, Ads, or inventory rewards.
 * Profile is local to the Life Empire save slot, persisted separately from runs.
 */
import type { EmpireChallengeId, EmpireRun } from './empireCardsEngine';
import { currentBoss } from './empireCardsEngine';

export interface EmpireAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}
export interface EmpireChallenge {
  id: EmpireChallengeId;
  name: string;
  description: string;
  target: number;
  icon: string;
}
export interface EmpireMedalProfile {
  version: 1;
  unlocked: string[];
  completedChallenges: EmpireChallengeId[];
}

export const EMPIRE_ACHIEVEMENTS: EmpireAchievement[] = [
  { id: 'first_hand', name: 'First Deal', description: 'Play your first business hand.', icon: '🃏' },
  { id: 'first_quarter', name: 'Open for Business', description: 'Clear your first quarter.', icon: '🏪' },
  { id: 'joint_venture', name: 'Deal Maker', description: 'Score a Joint Venture combination.', icon: '🤝' },
  { id: 'diversified', name: 'Four Pillars', description: 'Score a Diversified Empire combination.', icon: '🏢' },
  { id: 'dominance', name: 'Industry Leader', description: 'Score Industry Dominance.', icon: '🏆' },
  { id: 'supply', name: 'Supply Strategist', description: 'Score a Supply Chain combination.', icon: '📦' },
  { id: 'startup', name: 'Innovation Investor', description: 'Score a Startup Accelerator combination.', icon: '💡' },
  { id: 'expansion', name: 'Market Pioneer', description: 'Score a Market Expansion combination.', icon: '📈' },
  { id: 'full_team', name: 'Executive Board', description: 'Recruit four CEO Advisors in one run.', icon: '👔' },
  { id: 'boss', name: 'Crisis Manager', description: 'Beat a boss quarter.', icon: '🛡️' },
  { id: 'champion', name: 'Empire Builder', description: 'Complete all eight quarters on any difficulty.', icon: '👑' },
  { id: 'tycoon', name: 'Legendary Tycoon', description: 'Complete all eight quarters on Tycoon difficulty.', icon: '💎' },
];

export const EMPIRE_CHALLENGES: EmpireChallenge[] = [
  { id: 'venture_trio', name: 'Three Big Deals', description: 'Play 3 Joint Venture hands in one run.', target: 3, icon: '🤝' },
  { id: 'diversified_four', name: 'Four-Pillar Plan', description: 'Play 4 Diversified Empire hands in one run.', target: 4, icon: '🏢' },
  { id: 'clean_boss', name: 'Clean Audit', description: 'Clear a boss quarter without discarding that quarter.', target: 1, icon: '🛡️' },
  { id: 'no_discards', name: 'No Safety Net', description: 'Complete all 8 quarters without using a discard.', target: 1, icon: '🎯' },
];

const achievementIDs = new Set(EMPIRE_ACHIEVEMENTS.map(m => m.id));
const challengeIDs = new Set<EmpireChallengeId>(EMPIRE_CHALLENGES.map(c => c.id));
export function emptyEmpireMedals(): EmpireMedalProfile {
  return { version: 1, unlocked: [], completedChallenges: [] };
}

export function readEmpireMedals(value: unknown): EmpireMedalProfile {
  if (!value || typeof value !== 'object') return emptyEmpireMedals();
  const raw = value as Partial<EmpireMedalProfile>;
  if (raw.version !== 1) return emptyEmpireMedals();
  return {
    version: 1,
    unlocked: [...new Set(Array.isArray(raw.unlocked) ? raw.unlocked.filter((id): id is string => typeof id === 'string' && achievementIDs.has(id)) : [])],
    completedChallenges: [...new Set(Array.isArray(raw.completedChallenges)
      ? raw.completedChallenges.filter((id): id is EmpireChallengeId => typeof id === 'string' && challengeIDs.has(id as EmpireChallengeId))
      : [])],
  };
}

/** Pure transition; only completed actions award badges. Duplicate/rejected actions do nothing. */
export function applyEmpireMedalProgress(
  current: EmpireMedalProfile,
  before: EmpireRun,
  after: EmpireRun,
): EmpireMedalProfile {
  if (after === before) return current;
  const gained = new Set(current.unlocked);
  const challenges = new Set(current.completedChallenges);
  if (after.totalHandsPlayed > before.totalHandsPlayed) {
    gained.add('first_hand');
    const combo = after.lastComboId;
    if (combo === 'venture') gained.add('joint_venture');
    if (combo === 'diversified') gained.add('diversified');
    if (combo === 'dominance') gained.add('dominance');
    if (combo === 'supply') gained.add('supply');
    if (combo === 'startup') gained.add('startup');
    if (combo === 'expansion') gained.add('expansion');
  }
  if (after.phase === 'shop' && before.phase === 'play' && before.quarter === 1) gained.add('first_quarter');
  if (after.advisors.length >= 4 && before.advisors.length < 4) gained.add('full_team');
  if ((after.phase === 'shop' || after.phase === 'won') && before.phase === 'play' && currentBoss(before)) gained.add('boss');
  if (after.phase === 'won' && before.phase !== 'won') {
    gained.add('champion');
    if (after.difficulty === 'tycoon') gained.add('tycoon');
  }
  if (after.challengeCompleted && after.challengeId && challengeIDs.has(after.challengeId))
    challenges.add(after.challengeId);
  if (gained.size === current.unlocked.length && challenges.size === current.completedChallenges.length) return current;
  return { version: 1, unlocked: [...gained], completedChallenges: [...challenges] };
}

/** Recover provable milestones from a pre-achievements saved run without guessing old hands. */
export function reconcileEmpireMedals(profile: EmpireMedalProfile, run: EmpireRun | null): EmpireMedalProfile {
  if (!run) return profile;
  const achievements = new Set(profile.unlocked);
  const challenges = new Set(profile.completedChallenges);
  if (run.totalHandsPlayed > 0) achievements.add('first_hand');
  if (run.quarter > 1 || run.phase === 'shop' || run.phase === 'won') achievements.add('first_quarter');
  if (run.advisors.length >= 4) achievements.add('full_team');
  if (run.phase === 'won') {
    achievements.add('champion');
    if (run.difficulty === 'tycoon') achievements.add('tycoon');
  }
  if (run.challengeCompleted && run.challengeId && challengeIDs.has(run.challengeId)) challenges.add(run.challengeId);
  if (achievements.size === profile.unlocked.length && challenges.size === profile.completedChallenges.length) return profile;
  return { version: 1, unlocked: [...achievements], completedChallenges: [...challenges] };
}

export function activeEmpireChallenge(run: EmpireRun): EmpireChallenge | null {
  return EMPIRE_CHALLENGES.find(c => c.id === run.challengeId) ?? null;
}
export function empireChallengeProgress(run: EmpireRun): number {
  const challenge = activeEmpireChallenge(run);
  if (!challenge) return 0;
  return Math.min(challenge.target, run.challengeProgress ?? 0);
}
