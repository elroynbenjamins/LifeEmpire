/**
 * Optional teaching hints for Empire Cards.
 * Intentionally never chooses a card or computes a best hand.
 * No card indices, card IDs, previews, score optimization or state mutation.
 */
import { EMPIRE_CARDS, currentBoss, type Department, type EmpireRun } from './empireCardsEngine';

export type EmpireHintMode = 'play' | 'discard';
export interface EmpireStrategyHint {
  title: string;
  advice: string;
  context: string;
}

const LABELS: Record<Department, string> = {
  sales: 'Sales', operations: 'Operations', finance: 'Finance', innovation: 'Innovation',
};

const ADVISOR_HINTS: Record<string, string> = {
  franchise: 'Franchise Network benefits from Sales-heavy hands.',
  lean: 'Lean Operations rewards groups of Operations cards.',
  venture: 'Venture Capitalist rewards Finance participation and penalizes hands without it.',
  lab: 'Research Laboratory works best when Sales and Innovation appear together.',
  family: 'Family Holdings rewards a hand using all four departments.',
  logistics: 'Logistics Expert benefits when Sales and Operations work together.',
  digital: 'Digital Pioneer rewards Innovation-focused hands and Sales synergy.',
  mergers: 'M&A Attorney boosts Joint Ventures made from two department pairs.',
  crisis: 'Crisis Consultant can protect your cards from boss penalties.',
};

export function getEmpireStrategyHint(run: EmpireRun, mode: EmpireHintMode): EmpireStrategyHint {
  if (mode === 'discard') {
    return {
      title: 'Discard with a plan',
      advice: run.discardsLeft <= 0
        ? 'No discards remain this quarter. Use the cards you have and check the combination guide.'
        : 'Consider which departments you want to keep for later hands. Replacing cards can improve your options, but does not guarantee a stronger draw.',
      context: 'Choose cards to replace yourself. A discard uses one of your limited discard actions.',
    };
  }

  const counts: Record<Department, number> = { sales: 0, operations: 0, finance: 0, innovation: 0 };
  run.hand.forEach(id => {
    const department = EMPIRE_CARDS.find(c => c.id === id)?.department;
    if (department) counts[department]++;
  });
  const departments = (Object.keys(counts) as Department[]).filter(d => counts[d] > 0);
  const boss = currentBoss(run);

  if (run.quarter === 1 && run.totalHandsPlayed === 0) {
    return {
      title: 'First hand: experiment',
      advice: 'Tap cards from different departments and watch the live combination and score preview. Try pairing or specializing before committing your hand.',
      context: 'You may play up to four cards. Only Play Hand consumes a turn; experimenting is free.',
    };
  }

  if (boss && !run.advisors.includes('crisis')) {
    const affected: Record<string, Department | null> = {
      recession: 'sales', supply_crisis: 'operations', regulation: 'finance',
      tech_shift: 'innovation', anti_trust: null, inflation: null,
    };
    if (affected[boss.id]) {
      return {
        title: 'Consider the boss effect',
        advice: boss.name + ' weakens ' + LABELS[affected[boss.id]!] + ' card values. Check whether your combination bonus still makes those cards worthwhile.',
        context: 'A warning icon identifies affected cards. A high multiplier may still justify playing them.',
      };
    }
    if (boss.id === 'anti_trust') {
      return {
        title: 'Combination cap in effect',
        advice: 'Antitrust limits your combination multiplier. Consider Advisor bonuses and base card values as well.',
        context: 'Your live score preview already includes the cap.',
      };
    }
    if (boss.id === 'inflation') {
      return {
        title: 'Higher target this quarter',
        advice: 'Inflation raises the score required to advance. Think about how many hands you have left.',
        context: 'Choose whether to secure points now or preserve cards for later.',
      };
    }
  }

  const priority = ['venture', 'family', 'franchise', 'lean', 'lab', 'digital', 'mergers', 'logistics', 'crisis'];
  const advisor = priority.find(id => run.advisors.includes(id));
  if (advisor) {
    return {
      title: 'Think about your Advisors',
      advice: ADVISOR_HINTS[advisor],
      context: 'Experiment with combinations to see which bonuses activate, without committing a hand.',
    };
  }

  const richest = (Object.keys(counts) as Department[]).sort((a, b) => counts[b] - counts[a])[0];
  if (counts[richest] >= 3) {
    return {
      title: 'A department stands out',
      advice: 'You have several ' + LABELS[richest] + ' cards. Specialization can be valuable, but check whether a mixed approach offers more flexibility.',
      context: 'You decide which cards to use now and which to keep for the next hand.',
    };
  }

  if (departments.length === 4) {
    return {
      title: 'Several combinations are possible',
      advice: 'All four departments are represented. A balanced hand may be useful, but matching department pairs can offer alternatives.',
      context: 'Compare combinations using the live score preview; there is no single required choice.',
    };
  }

  return {
    title: 'Balance points and flexibility',
    advice: 'Look for shared departments and consider whether to specialize or combine two areas of the business.',
    context: 'Playing for immediate points is not always the same as building the strongest future hand.',
  };
}
