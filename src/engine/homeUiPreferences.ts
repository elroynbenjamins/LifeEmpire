/** Device-local UI-only preferences. Never persisted inside economic game saves. */
export const HOME_UI_DEFAULTS = {
  annualReport: true,
  pinnedGoals: true,
  personalLife: true,
  investments: true,
  ownedAssets: true,
  news: true,
} as const;
export type HomeUiSection = keyof typeof HOME_UI_DEFAULTS;
export type HomeUiPreferences = Record<HomeUiSection, boolean>;
export type WeeklyResultsPreferences = { compact: boolean };
export const WEEKLY_RESULTS_DEFAULTS: WeeklyResultsPreferences = { compact: false };

export function homeUiStorageKey(slot: number): string {
  return `life-empire-home-ui:v1:slot:${slot}`;
}
export function weeklyResultsStorageKey(slot: number): string {
  return `life-empire-weekly-results-ui:v1:slot:${slot}`;
}
export function readHomeUiPreferences(value: unknown): HomeUiPreferences {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.keys(HOME_UI_DEFAULTS).map(key =>
    [key, typeof raw[key] === 'boolean' ? raw[key] : true])) as HomeUiPreferences;
}
export function readWeeklyResultsPreferences(value: unknown): WeeklyResultsPreferences {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return { compact: raw.compact === true };
}
