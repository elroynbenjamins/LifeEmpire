/**
 * Relationship story events are deliberately rare: never more than two in any
 * rolling 40 in-game weeks and never within 16 weeks of the last generated event.
 * Every decision pop-up (including family milestones) shares the same budget.
 */
export const RELATIONSHIP_EVENT_WINDOW_WEEKS = 40;
export const RELATIONSHIP_EVENT_MAX_IN_WINDOW = 2;
export const RELATIONSHIP_EVENT_MIN_GAP_WEEKS = 16;

export function recentRelationshipEventWeeks(weeks: readonly number[] | undefined, globalWeek: number, legacyLastWeek = 0): number[] {
  const recorded = weeks === undefined
    ? (legacyLastWeek > 0 ? [legacyLastWeek] : [])
    : weeks;
  return [...new Set(recorded.filter((week) => Number.isInteger(week) && week > globalWeek - RELATIONSHIP_EVENT_WINDOW_WEEKS && week <= globalWeek))]
    .sort((a, b) => a - b);
}

export function canOfferRelationshipEvent(globalWeek: number, weeks: readonly number[], lastWeek = 0): boolean {
  const recent = recentRelationshipEventWeeks(weeks, globalWeek, lastWeek);
  const latest = Math.max(lastWeek, ...recent, 0);
  return globalWeek >= RELATIONSHIP_EVENT_MIN_GAP_WEEKS
    && globalWeek - latest >= RELATIONSHIP_EVENT_MIN_GAP_WEEKS
    && recent.length < RELATIONSHIP_EVENT_MAX_IN_WINDOW;
}
