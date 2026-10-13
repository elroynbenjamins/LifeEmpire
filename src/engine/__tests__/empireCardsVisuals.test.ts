import { EMPIRE_CARDS, EMPIRE_ADVISORS, EMPIRE_BOSSES, createEmpireRun, previewEmpireHand } from '../empireCardsEngine';
import {
  EMPIRE_DEPARTMENT_THEMES, EMPIRE_CARD_ICONS, EMPIRE_ADVISOR_ICONS,
  EMPIRE_ADVISOR_RARITY_COLORS, getEmpireCardTier, getEmpireCardIcon,
  getEmpireDepartmentTheme, getEmpireAdvisorIcon, isEmpireCardBossAffected,
} from '../../theme/empireCardsVisuals';

describe('Empire Cards presentation identity', () => {
  it('gives all 32 cards a usable stable vector icon and a department identity', () => {
    expect(EMPIRE_CARDS).toHaveLength(32);
    expect(Object.keys(EMPIRE_CARD_ICONS)).toHaveLength(32);
    expect(new Set(Object.keys(EMPIRE_CARD_ICONS))).toEqual(new Set(EMPIRE_CARDS.map(c => c.id)));
    expect(new Set(Object.values(EMPIRE_DEPARTMENT_THEMES).map(t => t.color)).size).toBe(4);
    expect(new Set(Object.values(EMPIRE_DEPARTMENT_THEMES).map(t => t.pattern)).size).toBe(4);
    for (const c of EMPIRE_CARDS) {
      const theme = getEmpireDepartmentTheme(c.department);
      expect(theme.title.length).toBeGreaterThan(0);
      expect(theme.shortName.length).toBeGreaterThan(0);
      expect(theme.color).toMatch(/^#[\da-fA-F]{6}$/);
      expect(theme.surface).toMatch(/^#[\da-fA-F]{8}$/);
      expect(getEmpireCardIcon(c)).toMatch(/^[a-z-]+$/);
    }
  });

  it('uses purely visual score bands, not randomized rarity mechanics', () => {
    expect(getEmpireCardTier(20)).toBe('core');
    expect(getEmpireCardTier(24)).toBe('core');
    expect(getEmpireCardTier(26)).toBe('growth');
    expect(getEmpireCardTier(30)).toBe('growth');
    expect(getEmpireCardTier(32)).toBe('flagship');
    expect(getEmpireCardTier(34)).toBe('flagship');
    const initial = createEmpireRun(1309);
    expect(initial.hand.map(id => EMPIRE_CARDS.find(c => c.id === id)?.points)).toEqual(
      createEmpireRun(1309).hand.map(id => EMPIRE_CARDS.find(c => c.id === id)?.points)
    );
    const points = previewEmpireHand(initial, [0,1,2,3]).points;
    for (const card of EMPIRE_CARDS) {
      getEmpireCardTier(card.points);
      getEmpireCardIcon(card);
      getEmpireDepartmentTheme(card.department);
    }
    expect(previewEmpireHand(initial, [0,1,2,3]).points).toBe(points);
  });

  it('only warns on cards whose points are actually affected by the active boss', () => {
    const byDepartment = Object.fromEntries(EMPIRE_CARDS.filter(c => c.points === 20).map(c => [c.department, c]));
    const impact = [
      ['recession', 'sales'],
      ['supply_crisis', 'operations'],
      ['regulation', 'finance'],
      ['tech_shift', 'innovation'],
    ] as const;
    for (const [bossId, department] of impact) {
      const boss = EMPIRE_BOSSES.find(b => b.id === bossId)!;
      for (const card of EMPIRE_CARDS) {
        expect(isEmpireCardBossAffected(card, boss)).toBe(card.department === department);
        expect(isEmpireCardBossAffected(card, boss, true)).toBe(false);
      }
    }
    for (const c of Object.values(byDepartment)) {
      expect(isEmpireCardBossAffected(c, null)).toBe(false);
      for (const id of ['anti_trust', 'inflation']) {
        expect(isEmpireCardBossAffected(c, EMPIRE_BOSSES.find(b => b.id === id)!)).toBe(false);
      }
    }
  });

  it('applies identity consistently to 15 Advisors and rarity colors', () => {
    expect(EMPIRE_ADVISORS).toHaveLength(15);
    expect(new Set(Object.keys(EMPIRE_ADVISOR_ICONS))).toEqual(new Set(EMPIRE_ADVISORS.map(a => a.id)));
    expect(new Set(Object.values(EMPIRE_ADVISOR_RARITY_COLORS)).size).toBe(3);
    for (const advisor of EMPIRE_ADVISORS) {
      expect(getEmpireAdvisorIcon(advisor.id)).toMatch(/^[a-z-]+$/);
      expect(EMPIRE_ADVISOR_RARITY_COLORS[advisor.rarity]).toMatch(/^#[\da-fA-F]{6}$/);
    }
  });
});
