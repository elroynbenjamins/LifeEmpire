import { getCompactWeeklyHighlights } from '../compactWeeklyReport';
import type { WeekSummary } from '../../types/game';

describe('Compact weekly results important facts', () => {
  const report = (data: Partial<WeekSummary> = {}) => ({ ...data } as WeekSummary);
  it('keeps quiet weeks quiet', () => {
    expect(getCompactWeeklyHighlights(report(), 0)).toEqual([]);
  });
  it('surfaces pending choices, inheritance, economic events and achievements', () => {
    const highlights = getCompactWeeklyHighlights(report({
      diedThisWeek: true,
      crashEvent: { title: 'A recession' } as WeekSummary['crashEvent'],
      careerPromotion: 'Promoted',
      relationshipEventTitle: 'Relationship decision',
      newAchievements: ['award-a', 'award-b'],
    }), 2);
    expect(highlights[0]).toMatch(/1 important follow-up/);
    expect(highlights).toContain('Life complete: succession follows this report');
    expect(highlights).toContain('Recession: A recession');
    expect(highlights).toContain('Career promotion earned');
    expect(highlights).toContain('2 achievements unlocked');
  });
  it('does not show a duplicate follow-up on succession-only weeks', () => {
    const highlights = getCompactWeeklyHighlights(report({ diedThisWeek: true }), 1);
    expect(highlights).toEqual(['Life complete: succession follows this report']);
  });
  it('keeps major family, stalled promotions and investment outcomes visible', () => {
    const highlights = getCompactWeeklyHighlights(report({
      partnerDiedName: 'Alex',
      promotionBlockedReason: 'Complete leadership training',
      familyMilestones: ['Child graduated'],
      investmentResult: { success: false } as WeekSummary['investmentResult'],
    }), 0);
    expect(highlights).toContain('Loss in the family: Alex');
    expect(highlights).toContain('Promotion requirement: Complete leadership training');
    expect(highlights).toContain('1 family milestone');
    expect(highlights).toContain('Investment failed');
  });
});
