import {
  HOME_UI_DEFAULTS, homeUiStorageKey, weeklyResultsStorageKey,
  readHomeUiPreferences, readWeeklyResultsPreferences, WEEKLY_RESULTS_DEFAULTS,
} from '../homeUiPreferences';

describe('Home layout preferences', () => {
  it('defaults sections to visible and summary to full for existing saves', () => {
    expect(readHomeUiPreferences(null)).toEqual(HOME_UI_DEFAULTS);
    expect(readHomeUiPreferences(undefined)).toEqual(HOME_UI_DEFAULTS);
    expect(readWeeklyResultsPreferences(null)).toEqual(WEEKLY_RESULTS_DEFAULTS);
  });
  it('keeps independently toggled visibility after serialization', () => {
    const changed = { ...HOME_UI_DEFAULTS, news: false, personalLife: false, ownedAssets: false };
    expect(readHomeUiPreferences(JSON.parse(JSON.stringify(changed)))).toEqual(changed);
    expect(readHomeUiPreferences({ annualReport: false, news: 'hidden' })).toEqual({
      ...HOME_UI_DEFAULTS, annualReport: false,
    });
    expect(readWeeklyResultsPreferences({ compact: true })).toEqual({ compact: true });
    expect(readWeeklyResultsPreferences({ compact: 'true' })).toEqual({ compact: false });
  });
  it('never combines UI preferences across different save slots', () => {
    expect(new Set([0,1,2].map(homeUiStorageKey)).size).toBe(3);
    expect(new Set([0,1,2].map(weeklyResultsStorageKey)).size).toBe(3);
    expect(homeUiStorageKey(0)).not.toBe(weeklyResultsStorageKey(0));
  });
});
