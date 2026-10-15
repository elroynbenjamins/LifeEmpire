import type { WeekSummary } from '../types/game';

/** Only consequential events belong in the compact view; full report stays accessible. */
export function getCompactWeeklyHighlights(summary: WeekSummary, pendingDecisionCount: number): string[] {
  return [
    ...(pendingDecisionCount > 0 ? [pendingDecisionCount + ' important follow-up' + (pendingDecisionCount === 1 ? '' : 's') + ' after continuing'] : []),
    ...(summary.diedThisWeek ? ['Life complete: succession follows this report'] : []),
    ...(summary.crashEvent ? ['Recession: ' + summary.crashEvent.title] : []),
    ...(summary.inflationEvent ? ['Yearly inflation changed costs and salaries'] : []),
    ...(summary.careerPromotion ? ['Career promotion earned'] : []),
    ...(summary.careerRaise ? ['Salary increased'] : []),
    ...(summary.relationshipEventTitle ? ['Personal life: ' + summary.relationshipEventTitle] : []),
    ...(summary.marketEventTitle ? ['Market: ' + summary.marketEventTitle] : []),
    ...((summary.newAchievements?.length ?? 0) > 0 ? [summary.newAchievements!.length + ' achievement' + (summary.newAchievements!.length === 1 ? '' : 's') + ' unlocked'] : []),
    ...((summary.auctionResults?.length ?? 0) > 0 ? [summary.auctionResults!.length + ' property auction result' + (summary.auctionResults!.length === 1 ? '' : 's')] : []),
  ];
}
