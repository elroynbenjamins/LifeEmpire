/**
 * Empire Cards - isolated, animation-free roguelite business card mode.
 * All values are run-only. No main-game cash, gems, time, or state is changed.
 */
export type Department = 'sales' | 'operations' | 'finance' | 'innovation';
export interface EmpireCard { id: string; name: string; department: Department; points: number }
export interface Advisor { id: string; name: string; description: string; rarity: 'common' | 'uncommon' | 'rare' }
export interface Combo { id: string; name: string; multiplier: number; description: string }
export interface Boss { id: string; name: string; description: string }
export interface Quarter { name: string; target: number }
export type Offer = { kind: 'advisor' | 'upgrade' | 'card'; id: string; cost: number };
export type EmpirePhase = 'play' | 'shop' | 'won' | 'lost';
export interface EmpireRun {
  version: 1;
  seed: number;
  quarter: number;
  phase: EmpirePhase;
  score: number;
  handsLeft: number;
  discardsLeft: number;
  capital: number;
  deck: string[];
  hand: string[];
  discarded: string[];
  advisors: string[];
  upgrades: Record<string, number>;
  bosses: string[];
  offers: Offer[];
  lastMessage: string;
  lastHandScore: number;
  totalHandsPlayed: number;
  /** Optional for older saved v1 runs. */
  retiredCards?: number;
  lastComboId?: string | null;
}

const CARD_GROUPS: { department: Department; names: string[]; points: number[] }[] = [
  { department: 'sales', names: ['Local Advertising','Sales Team','Online Store','Product Launch','Retail Outlet','Brand Campaign','Loyalty Program','Franchise Deal'], points: [20,22,24,26,28,30,32,34] },
  { department: 'operations', names: ['Warehouse','Delivery Fleet','Skilled Staff','Supplier Deal','Quality Control','Factory','Automation','Lean Production'], points: [20,22,24,26,28,30,32,34] },
  { department: 'finance', names: ['Savings Reserve','Business Loan','Accountant','Cash Forecast','Investor Pitch','Equity Funding','Acquisition','Holding Company'], points: [20,22,24,26,28,30,32,34] },
  { department: 'innovation', names: ['Market Research','Product Prototype','Software Tools','Data Analytics','Research Team','Patent Filing','AI Systems','New Technology'], points: [20,22,24,26,28,30,32,34] },
];
export const EMPIRE_CARDS: EmpireCard[] = CARD_GROUPS.flatMap(({ department, names, points }) =>
  names.map((name, index) => ({ id: department + '-' + (index + 1), name, department, points: points[index] }))
);
const CARD_BY_ID: Record<string, EmpireCard> = Object.fromEntries(EMPIRE_CARDS.map(c => [c.id, c]));

export const EMPIRE_ADVISORS: Advisor[] = [
  { id: 'brand', name: 'Brand Manager', description: '+12 base points per Sales card.', rarity: 'common' },
  { id: 'operator', name: 'Operations Lead', description: '+12 base points per Operations card.', rarity: 'common' },
  { id: 'cfo', name: 'Chief Financial Officer', description: '+12 base points per Finance card.', rarity: 'common' },
  { id: 'rnd', name: 'R&D Director', description: '+12 base points per Innovation card.', rarity: 'common' },
  { id: 'franchise', name: 'Franchise Network', description: '+15 base points with 2 Sales; ×1.7 with 3+ Sales.', rarity: 'uncommon' },
  { id: 'lean', name: 'Lean Operations', description: '+55 base points with 2+ Operations cards.', rarity: 'uncommon' },
  { id: 'venture', name: 'Venture Capitalist', description: '×1.35 with Finance; otherwise ×0.9.', rarity: 'rare' },
  { id: 'lab', name: 'Research Laboratory', description: '×1.3 with Sales + Innovation.', rarity: 'uncommon' },
  { id: 'family', name: 'Family Holdings', description: '×1.5 for Diversified Empire.', rarity: 'rare' },
  { id: 'tax', name: 'Tax Specialist', description: '+4 Run Capital after each quarter.', rarity: 'common' },
  { id: 'logistics', name: 'Logistics Expert', description: '+30 base points with Sales + Operations.', rarity: 'common' },
  { id: 'digital', name: 'Digital Pioneer', description: '+25 base with Sales + Innovation; +45 with 3+ Innovation.', rarity: 'common' },
  { id: 'mergers', name: 'M&A Attorney', description: '×1.65 for a Joint Venture.', rarity: 'uncommon' },
  { id: 'trainer', name: 'Corporate Trainer', description: '+5 base points for every card played.', rarity: 'common' },
  { id: 'crisis', name: 'Crisis Consultant', description: 'Ignores boss card penalties; +45 base points during boss quarters.', rarity: 'rare' },
];

export const EMPIRE_COMBOS: Combo[] = [
  { id: 'dominance', name: 'Industry Dominance', multiplier: 3.25, description: 'Four cards from one department.' },
  { id: 'diversified', name: 'Diversified Empire', multiplier: 2.65, description: 'One card from each department.' },
  { id: 'venture', name: 'Joint Venture', multiplier: 2.45, description: 'Two cards from each of two departments.' },
  { id: 'specialization', name: 'Specialization', multiplier: 2.15, description: 'Three cards from one department.' },
  { id: 'supply', name: 'Supply Chain', multiplier: 2.4, description: '2 Operations + Sales + Finance.' },
  { id: 'startup', name: 'Startup Accelerator', multiplier: 2.35, description: '2 Innovation + Sales + Finance.' },
  { id: 'expansion', name: 'Market Expansion', multiplier: 2.35, description: '2 Sales + Operations + Innovation.' },
  { id: 'partnership', name: 'Department Partnership', multiplier: 1.6, description: 'At least two cards of one department.' },
];

export const EMPIRE_BOSSES: Boss[] = [
  { id: 'recession', name: 'Economic Recession', description: 'Sales card values reduced by 25%.' },
  { id: 'supply_crisis', name: 'Supply Chain Crisis', description: 'Operations card values reduced by 25%.' },
  { id: 'regulation', name: 'Regulatory Investigation', description: 'Finance cards lose 10 base points each.' },
  { id: 'tech_shift', name: 'Technology Shift', description: 'Innovation card values reduced by 25%.' },
  { id: 'anti_trust', name: 'Antitrust Inquiry', description: 'Hand combination multipliers capped at ×2.25.' },
  { id: 'inflation', name: 'High Inflation', description: 'Quarter target increased by 20%.' },
];

export const EMPIRE_QUARTERS: Quarter[] = [
  { name: 'Startup Launch', target: 350 },
  { name: 'First Customers', target: 520 },
  { name: 'Market Downturn', target: 730 },
  { name: 'National Expansion', target: 980 },
  { name: 'Corporate Growth', target: 1330 },
  { name: 'International Competition', target: 1700 },
  { name: 'Holding Formation', target: 1950 },
  { name: 'Global Business Empire', target: 2100 },
];

export function randomStep(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}
function shuffled<T>(values: T[], seed: number): [T[], number] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    seed = randomStep(seed);
    // Use high-order random bits: LCG low bits produce highly patterned shuffles.
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return [result, seed];
}
function pull(run: EmpireRun, count: number): EmpireRun {
  const next: EmpireRun = { ...run, deck: [...run.deck], hand: [...run.hand], discarded: [...run.discarded] };
  while (count-- > 0) {
    if (!next.deck.length && next.discarded.length) {
      [next.deck, next.seed] = shuffled(next.discarded, next.seed);
      next.discarded = [];
    }
    if (!next.deck.length) break;
    next.hand.push(next.deck.pop()!);
  }
  return next;
}
function makeOffers(run: EmpireRun): EmpireRun {
  let seed = run.seed;
  const available = EMPIRE_ADVISORS.filter(a => !run.advisors.includes(a.id));
  const offers: Offer[] = [];
  // Two distinct Advisor choices reduce bad-luck shops without increasing the four-slot cap.
  // Keep Advisor offers available in late shops so players can pivot their build.
  // A full Advisor roster requires explicitly choosing an existing one to replace.
  const [pool, nextSeed] = shuffled(available, seed);
  seed = nextSeed;
  for (const advisor of pool.slice(0, 2)) {
    offers.push({ kind: 'advisor', id: advisor.id, cost: advisor.rarity === 'rare' ? 9 : advisor.rarity === 'uncommon' ? 7 : 5 });
  }
  seed = randomStep(seed);
  offers.push({ kind: 'upgrade', id: EMPIRE_COMBOS[Math.floor(seed / 4294967296 * EMPIRE_COMBOS.length)].id, cost: 6 });
  seed = randomStep(seed);
  // Draft a stronger card instead of diluting the deck with a random low-value copy.
  const potential = EMPIRE_CARDS.filter(c => c.points >= 28);
  offers.push({ kind: 'card', id: potential[Math.floor(seed / 4294967296 * potential.length)].id, cost: 4 });
  return { ...run, offers, seed };
}
export function createEmpireRun(seed = Date.now() >>> 0): EmpireRun {
  const normalized = (seed >>> 0) || 1;
  let deck: string[], newSeed: number;
  [deck, newSeed] = shuffled(EMPIRE_CARDS.map(c => c.id), normalized);
  const [bosses, bossSeed] = shuffled(EMPIRE_BOSSES.map(b => b.id), newSeed);
  return pull({
    version: 1, seed: bossSeed, quarter: 1, phase: 'play', score: 0,
    handsLeft: 3, discardsLeft: 2, capital: 0, deck, hand: [], discarded: [],
    advisors: [], upgrades: {}, bosses: bosses.slice(0, 3),
    offers: [], lastMessage: 'Select up to 4 cards, then Play Hand.', lastHandScore: 0, totalHandsPlayed: 0, retiredCards: 0, lastComboId: null,
  }, 7);
}
export function currentBoss(run: EmpireRun): Boss | null {
  const index = [3, 6, 8].indexOf(run.quarter);
  return index < 0 ? null : EMPIRE_BOSSES.find(b => b.id === run.bosses[index]) ?? null;
}
export function quarterTarget(run: EmpireRun): number {
  const target = EMPIRE_QUARTERS[run.quarter - 1]?.target ?? EMPIRE_QUARTERS[7].target;
  return currentBoss(run)?.id === 'inflation' ? Math.ceil(target * 1.2) : target;
}
export function findEmpireCombo(cards: EmpireCard[]): Combo | null {
  const n = cards.length;
  const counts = { sales: 0, operations: 0, finance: 0, innovation: 0 };
  cards.forEach(c => { counts[c.department]++; });
  const sorted = Object.values(counts).sort((a, b) => b - a);
  const match = (id: string) => EMPIRE_COMBOS.find(c => c.id === id)!;
  if (n === 4 && sorted[0] === 4) return match('dominance');
  if (n === 4 && sorted[0] === 1) return match('diversified');
  if (n === 4 && sorted[0] === 2 && sorted[1] === 2) return match('venture');
  if (n === 4 && sorted[0] === 3) return match('specialization');
  if (n === 4 && counts.operations === 2 && counts.sales === 1 && counts.finance === 1) return match('supply');
  if (n === 4 && counts.innovation === 2 && counts.sales === 1 && counts.finance === 1) return match('startup');
  if (n === 4 && counts.sales === 2 && counts.operations === 1 && counts.innovation === 1) return match('expansion');
  if (sorted[0] >= 2) return match('partnership');
  return null;
}
export interface ScorePreview {
  points: number;
  base: number;
  multiplier: number;
  combo: Combo | null;
  boss: Boss | null;
  /** Which owned Advisors actually contributed to this hand. */
  activeAdvisorIds: string[];
  /** A warning is shown when an Advisor applies a negative modifier. */
  advisorWarning: string | null;
}
export function previewEmpireHand(run: EmpireRun, indices: number[]): ScorePreview {
  const unique = [...new Set(indices)].filter(i => Number.isInteger(i) && i >= 0 && i < run.hand.length).slice(0, 4);
  const cards = unique.map(i => CARD_BY_ID[run.hand[i]]).filter((c): c is EmpireCard => Boolean(c));
  const counts = { sales: 0, operations: 0, finance: 0, innovation: 0 };
  cards.forEach(c => { counts[c.department]++; });
  const boss = currentBoss(run);
  const protectedFromBoss = run.advisors.includes('crisis');
  let base = cards.reduce((total, c) => {
    let points = c.points;
    if (!protectedFromBoss && boss?.id === 'recession' && c.department === 'sales') points *= 0.75;
    if (!protectedFromBoss && boss?.id === 'supply_crisis' && c.department === 'operations') points *= 0.75;
    if (!protectedFromBoss && boss?.id === 'regulation' && c.department === 'finance') points = Math.max(0, points - 10);
    if (!protectedFromBoss && boss?.id === 'tech_shift' && c.department === 'innovation') points *= 0.75;
    return total + points;
  }, 0);
  const combo = findEmpireCombo(cards);
  let multiplier = combo ? combo.multiplier + (run.upgrades[combo.id] ?? 0) * 0.25 : 1;
  const has = (id: string) => run.advisors.includes(id);
  if (has('brand')) base += counts.sales * 12;
  if (has('operator')) base += counts.operations * 12;
  if (has('cfo')) base += counts.finance * 12;
  if (has('rnd')) base += counts.innovation * 12;
  if (has('lean') && counts.operations >= 2) base += 55;
  if (has('logistics') && counts.sales && counts.operations) base += 30;
  if (has('digital') && counts.innovation && counts.sales) base += 25;
  if (has('digital') && counts.innovation >= 3) base += 45;
  if (has('franchise') && counts.sales === 2) base += 15;
  if (has('trainer')) base += cards.length * 5;
  if (has('crisis') && boss) base += 45;
  // Antitrust caps combination upgrades, not independently purchased advisor effects.
  if (boss?.id === 'anti_trust' && !protectedFromBoss) multiplier = Math.min(2.25, multiplier);
  if (has('franchise') && counts.sales >= 3) multiplier *= 1.7;
  if (has('venture')) multiplier *= counts.finance ? 1.35 : 0.9;
  if (has('lab') && counts.sales && counts.innovation) multiplier *= 1.3;
  if (has('family') && combo?.id === 'diversified') multiplier *= 1.5;
  if (has('mergers') && combo?.id === 'venture') multiplier *= 1.65;
  const activeAdvisorIds = run.advisors.filter(id => cards.length > 0 && (
    (id === 'brand' && counts.sales > 0)
    || (id === 'operator' && counts.operations > 0)
    || (id === 'cfo' && counts.finance > 0)
    || (id === 'rnd' && counts.innovation > 0)
    || (id === 'franchise' && counts.sales >= 2)
    || (id === 'lean' && counts.operations >= 2)
    || (id === 'venture')
    || (id === 'lab' && counts.sales > 0 && counts.innovation > 0)
    || (id === 'family' && combo?.id === 'diversified')
    || (id === 'logistics' && counts.sales > 0 && counts.operations > 0)
    || (id === 'digital' && (counts.innovation >= 3 || (counts.innovation > 0 && counts.sales > 0)))
    || (id === 'mergers' && combo?.id === 'venture')
    || (id === 'trainer')
    || (id === 'crisis' && boss !== null)
  ));
  const advisorWarning = has('venture') && cards.length > 0 && counts.finance === 0
    ? 'Venture Capitalist: no Finance card (×0.90 penalty)' : null;
  return { points: Math.round(base * multiplier), base: Math.round(base), multiplier, combo, boss, activeAdvisorIds, advisorWarning };
}
/** Choose the strongest currently playable hand. A suggestion, never an automatic spend. */
export function suggestEmpireHand(run: EmpireRun): number[] {
  if (run.phase !== 'play') return [];
  const length = run.hand.length;
  let best: number[] = [];
  let bestScore = -1;
  for (let a = 0; a < length; a++) {
    for (let b = a + 1; b < length; b++) {
      for (let c = b + 1; c < length; c++) {
        for (let d = c + 1; d < length; d++) {
          const indices = [a, b, c, d];
          const score = previewEmpireHand(run, indices).points;
          if (score > bestScore) { bestScore = score; best = indices; }
        }
      }
    }
  }
  // Fallback when an old save contains fewer than four cards.
  if (best.length === 0) return run.hand.map((_, i) => i).slice(0, 4);
  return best;
}
export function playEmpireHand(run: EmpireRun, indices: number[]): EmpireRun {
  if (run.phase !== 'play' || run.handsLeft <= 0 || indices.length < 1 || indices.length > 4) return run;
  if (new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= run.hand.length)) return run;
  const handScore = previewEmpireHand(run, indices);
  const consumed = run.hand.filter((_, i) => indices.includes(i));
  const remaining = run.hand.filter((_, i) => !indices.includes(i));
  let next: EmpireRun = {
    ...run, hand: remaining, discarded: [...run.discarded, ...consumed],
    score: run.score + handScore.points, handsLeft: run.handsLeft - 1,
    totalHandsPlayed: run.totalHandsPlayed + 1,
    lastHandScore: handScore.points, lastComboId: handScore.combo?.id ?? null,
    lastMessage: (handScore.combo?.name ?? 'Basic Play') + ': +' + handScore.points.toLocaleString('en-US') + ' points.',
  };
  if (next.score >= quarterTarget(next)) {
    if (next.quarter === EMPIRE_QUARTERS.length) return { ...next, phase: 'won', lastMessage: 'Empire completed! All eight quarters cleared.' };
    const reward = 7 + next.handsLeft * 2 + (next.advisors.includes('tax') ? 4 : 0);
    return makeOffers({ ...next, phase: 'shop', capital: next.capital + reward, lastMessage: 'Quarter cleared! +' + reward + ' Run Capital.' });
  }
  if (next.handsLeft === 0) return { ...next, phase: 'lost', lastMessage: 'The quarter target was not reached. Run over.' };
  next = pull(next, Math.max(0, 7 - next.hand.length));
  return next;
}
export function discardEmpireCards(run: EmpireRun, indices: number[]): EmpireRun {
  if (run.phase !== 'play' || run.discardsLeft <= 0 || indices.length < 1 || indices.length > 4) return run;
  if (new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= run.hand.length)) return run;
  const consumed = run.hand.filter((_, i) => indices.includes(i));
  const remaining = run.hand.filter((_, i) => !indices.includes(i));
  return pull({ ...run, hand: remaining, discarded: [...run.discarded, ...consumed], discardsLeft: run.discardsLeft - 1, lastMessage: 'Cards replaced.' }, consumed.length);
}
export function buyEmpireOffer(run: EmpireRun, index: number, replaceAdvisorId?: string): EmpireRun {
  if (run.phase !== 'shop') return run;
  const offer = run.offers[index];
  if (!offer || run.capital < offer.cost) return run;
  if (offer.kind === 'advisor') {
    if (run.advisors.includes(offer.id)) return run;
    if (run.advisors.length >= 4 && (!replaceAdvisorId || !run.advisors.includes(replaceAdvisorId))) return run;
  }
  const next: EmpireRun = { ...run, capital: run.capital - offer.cost, offers: run.offers.filter((_, i) => i !== index) };
  if (offer.kind === 'advisor') next.advisors = run.advisors.length >= 4
    ? run.advisors.map(id => id === replaceAdvisorId ? offer.id : id)
    : [...run.advisors, offer.id];
  if (offer.kind === 'upgrade') next.upgrades = { ...run.upgrades, [offer.id]: (run.upgrades[offer.id] ?? 0) + 1 };
  if (offer.kind === 'card') next.deck = [...run.deck, offer.id];
  next.lastMessage = 'Purchased ' + (offer.kind === 'advisor' ? EMPIRE_ADVISORS.find(a => a.id === offer.id)?.name : offer.kind === 'upgrade' ? EMPIRE_COMBOS.find(c => c.id === offer.id)?.name : CARD_BY_ID[offer.id]?.name) + '.';
  return next;
}
/** Buy the combination you actually want, rather than depending only on RNG. */
export function trainEmpireCombo(run: EmpireRun, comboId: string): EmpireRun {
  if (run.phase !== 'shop' || !EMPIRE_COMBOS.some(c => c.id === comboId)) return run;
  const currentLevel = run.upgrades[comboId] ?? 0;
  const cost = 7 + currentLevel * 2;
  if (currentLevel >= 4 || run.capital < cost) return run;
  return {
    ...run, capital: run.capital - cost,
    upgrades: { ...run.upgrades, [comboId]: currentLevel + 1 },
    lastMessage: EMPIRE_COMBOS.find(c => c.id === comboId)!.name + ' trained to level ' + (currentLevel + 1) + '.',
  };
}
/** Permanently trim a low-value card from this run's deck, never below 20 cards. */
export function retireEmpireCard(run: EmpireRun, cardId: string): EmpireRun {
  if (run.phase !== 'shop' || !CARD_BY_ID[cardId]) return run;
  const retired = run.retiredCards ?? 0;
  const count = run.deck.length + run.hand.length + run.discarded.length;
  const cost = 4 + retired * 2;
  if (retired >= 4 || count <= 20 || run.capital < cost) return run;
  const fields = ['deck', 'hand', 'discarded'] as const;
  for (const field of fields) {
    const index = run[field].indexOf(cardId);
    if (index >= 0) {
      const cards = [...run[field]];
      cards.splice(index, 1);
      return { ...run, [field]: cards, retiredCards: retired + 1,
        capital: run.capital - cost, lastMessage: 'Retired ' + CARD_BY_ID[cardId].name + ' from your run.' };
    }
  }
  return run;
}
export function rerollEmpireShop(run: EmpireRun): EmpireRun {
  return run.phase !== 'shop' || run.capital < 2 ? run : makeOffers({ ...run, capital: run.capital - 2 });
}
export function nextEmpireQuarter(run: EmpireRun): EmpireRun {
  if (run.phase !== 'shop' || run.quarter >= EMPIRE_QUARTERS.length) return run;
  let deck: string[], seed: number;
  [deck, seed] = shuffled([...run.deck, ...run.hand, ...run.discarded], run.seed);
  const next: EmpireRun = {
    ...run, quarter: run.quarter + 1, phase: 'play', score: 0,
    handsLeft: run.quarter + 1 >= 5 ? 4 : 3, discardsLeft: run.quarter + 1 >= 5 ? 3 : 2, seed, deck, hand: [], discarded: [], offers: [],
    lastHandScore: 0, lastMessage: 'A new quarter begins. Select your cards.',
  };
  return pull(next, 7);
}
export function isEmpireRun(value: unknown): value is EmpireRun {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<EmpireRun>;
  return r.version === 1 && Number.isInteger(r.quarter) && (r.quarter ?? 0) >= 1 && (r.quarter ?? 0) <= 8
    && ['play', 'shop', 'won', 'lost'].includes(r.phase as string)
    && Number.isInteger(r.seed) && typeof r.capital === 'number' && typeof r.score === 'number'
    && Array.isArray(r.deck) && Array.isArray(r.hand) && Array.isArray(r.discarded)
    && Array.isArray(r.advisors) && Array.isArray(r.bosses) && Array.isArray(r.offers)
    && r.deck.every(id => typeof id === 'string' && !!CARD_BY_ID[id])
    && r.hand.every(id => typeof id === 'string' && !!CARD_BY_ID[id]);
}
