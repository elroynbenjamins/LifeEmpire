# Empire Cards — balance baseline (2026-10-13)

This document records the initial release balance and implementation goals for **Empire Cards**, an optional, low-motion roguelite activity inside Life Empire.

## Fixed scope

- 32 starting cards: 8 each of Sales, Operations, Finance, Innovation.
- 15 CEO Advisors; four active Advisor slots.
- 8 business combinations; only the best fitting combination scores per hand.
- 8 quarters; a run has no time limit and saves locally per Life Empire save slot.
- 6 possible boss conditions; three distinct bosses appear during quarters 3, 6, and 8.
- Run Capital is **not** personal cash/gems/weekly game time. No main-game economy rewards are wired yet.

## Quarter curve

| Quarter | Target | Hands | Discards | Boss? |
| --- | ---: | ---: | ---: | --- |
| 1 Startup Launch | 350 | 3 | 2 | No |
| 2 First Customers | 520 | 3 | 2 | No |
| 3 Market Downturn | 730 | 3 | 2 | Yes |
| 4 National Expansion | 980 | 3 | 2 | No |
| 5 Corporate Growth | 1,330 | 4 | 3 | No |
| 6 International Competition | 1,700 | 4 | 3 | Yes |
| 7 Holding Formation | 1,950 | 4 | 3 | No |
| 8 Global Business Empire | 2,100 | 4 | 3 | Yes |

The Inflation boss raises its quarter target by 20%. The other bosses primarily alter card values or cap the base combination multiplier. Crisis Consultant protects boss card values and adds +45 base points during boss quarters, but does not waive the Inflation target increase.

## Shops and card decisions

- Quarter rewards: 7 Run Capital plus 2 per unused hand; Tax Specialist adds another 4.
- Two distinct Advisor offers, one random combination upgrade, one improved card offer.
- Advisor slots stay limited to four. When slots are full, a player may explicitly choose which existing Advisor to replace before purchasing another one.
- Optional combination-specific training (level 1–4) costs 7/9/11/13 Capital and increases that combo's multiplier by 0.25 per level.
- Optional card retirement (up to 4 cards, never fewer than 20 total) costs 4/6/8/10 Capital.
- Rerolling offers costs 2 Run Capital.
- A free **Suggest Best Hand** action highlights an optimal scoring four-card selection within the current hand but does **not** auto-play or spend resources.
- Seeded randomness uses high-order pseudorandom bits to avoid patterned shuffles.

## Benchmark: 120 deterministic seeds per simulated playstyle

| Completed through | Basic first-4 player | Guided (best-hand suggestion, simple shop) | Strategic (best hand, targeted shops) |
| --- | ---: | ---: | ---: |
| Quarter 1 | 120 | 120 | 120 |
| Quarter 2 | 118 | 120 | 120 |
| Quarter 3 | 77 | 120 | 120 |
| Quarter 4 | 39 | 120 | 120 |
| Quarter 5 | 24 | 120 | 120 |
| Quarter 6 | 3 | 104 | 112 |
| Quarter 7 | 0 | 77 | 110 |
| Quarter 8 | 0 | 33 | 80 |

Scripted results are **not human player win rates**. These are regression benchmarks from `src/engine/__tests__/empireCardsBalance.test.ts` and should be rerun after any scoring, target, shop, or deck-size changes.

The basic player chooses the first four cards and buys the first affordable Advisor. The guided player chooses the highest-scoring four-card hand and buys the first affordable Advisor. The strategic player additionally prioritizes multiplicative Advisors and Diversified Empire combo training.

## Advisor parity audit — 2026-10-13

The test in `src/engine/__tests__/empireCardsAdvisorAudit.test.ts` evaluates all **15 Advisors** on **236 deterministic samples** (180 selected best-of-seven hands plus 56 constructed specialist/boss hands). Numbers below are isolated *average relative scoring improvements*, not full-run win rates. The six economic boss effects and 32-card starter pool are unchanged.

| Advisor | Previous scoring gain | Rebalanced gain (approx) | Changes |
| --- | ---: | ---: | --- |
| Venture Capitalist | +50.9% | +23.6% | Finance ×1.35; no Finance ×0.90 |
| Family Holdings | +34.4% | +22.9% | Diversified ×1.50 |
| Research Laboratory | +27.9% | +16.7% | Sales + Innovation ×1.30 |
| Corporate Trainer | +27.4% | +17.1% | +5 per played card |
| Brand Manager | +10.4% | +12.4% | +12 per Sales card |
| Operations Lead | +8.5% | +10.2% | +12 per Operations card |
| Chief Financial Officer | +8.2% | +9.9% | +12 per Finance card |
| R&D Director | +7.1% | +8.5% | +12 per Innovation card |
| Franchise Network | +5.0% | +8.9% | +15 base with exactly 2 Sales; ×1.70 with 3+ Sales |
| Lean Operations | +6.8% | +9.3% | +55 base with 2+ Operations |
| M&A Attorney | +8.6% | +14.1% | Joint Venture ×1.65 |
| Crisis Consultant | +4.4% | +8.5% | Boss protection +45 base in boss quarters |
| Logistics Expert | +14.2% | +14.2% | Unchanged |
| Digital Pioneer | +11.9% | Increased for 3+ Innovation | +25 Sales/Innovation and +45 for 3+ Innovation |
| Tax Specialist | 0% direct scoring | 0% direct scoring | +4 **Run Capital** per successful quarter (was +2) |

**Tax Specialist is an economic Advisor, not a scoring Advisor.** Its progression value must be judged over a full run and relative to its opportunity cost of using an Advisor slot.

### Five specialized build checks

A controlled seven-card hand with four intended department cards was scored using the best hand. This demonstrates the intended strategic specialization; it is not a full-run simulation.

| Build | Specialist score | Four generic department Advisors |
| --- | ---: | ---: |
| Sales | 1,061 | 559 |
| Operations | 803 | 559 |
| Finance | 842 | 559 |
| Innovation | 770 | 559 |
| Diversified | 935 | 488 |

The mobile UI identifies which Advisors contribute to a selected hand and warns when Venture Capitalist imposes its no-Finance penalty. Later UI refinements add small optional animations but no saved-state changes.

The *intermediate* first Advisor reduction made quarter eight excessively hard (3/120 guided wins). The finale was therefore recalibrated to 1,950 in quarter seven and 2,100 in quarter eight, preserving a difficult but achievable late game with multiple conditional scoring approaches.

## Motion & deck-archetype refinement (2026-10-13)

Lightweight animations are limited to three short, built-in React Native `Animated` effects: a selected card lifts 5px and grows by 2.5% (120–145ms), the points total pulses after a played hand (~230ms), and transitions between play, shop and quarters fade/shift slightly (185ms). They animate only opacity/transform using the native driver; no additional imagery, video, timers, or heavy animation libraries. OS reduced-motion accessibility settings disable the effects, while color/border/selection states remain visible.

### Why specialized combos were changed

The first full-run archetype benchmark exposed a steep advantage for Finance and Diversified decks (around 64% final wins each) compared with Sales, Operations, and Innovation (11–16% each). This was largely due to rare combo patterns earning *less* than the easier Diversified hand.

Combo base multipliers were raised for the rarer patterns, without changing the 32-card/15-Advisor/8-combo/8-quarter/6-boss content contract:

- Industry Dominance (4 matching): ×3.40
- Specialization (3 matching): ×2.70
- Supply Chain / Startup Accelerator / Market Expansion: ×2.85 each
- Joint Venture: ×2.55
- Diversified Empire remains ×2.65

A Sales specialist bot now trains the more attainable **Specialization** combo instead of focusing solely on the rare four-of-a-kind.

### Full-run comparison after refinements

The `src/engine/__tests__/empireCardsArchetypes.test.ts` test uses 100 fixed seeds *for each of five shop policies*. These policies use best-hand selection, purchase targeted Advisors, train one desired combination, and sometimes retire low cards. This is a model-based comparative benchmark, **not a measurement of human players**, and it does not yet model tactical discard choices.

| Archetype | Wins out of 100 | Average quarters cleared |
| --- | ---: | ---: |
| Sales | 34 | 6.68 |
| Operations | 33 | 6.74 |
| Finance | 62 | 7.10 |
| Innovation | 38 | 6.78 |
| Diversified | 66 | 7.29 |

All five strategies are now viable, though Finance and Diversified remain easier in these particular scripted policies. Future passes should test conditional discard decisions, varied shop purchasing, and genuine player data before trying to equalize win rates further.

### Overall seeded benchmark, updated

After a follow-up parity refinement, the existing 120-seed comparison reached **33/120 guided final victories** and **80/120 strategic final victories**; the casual first-four bot still reached **0/120**. This corresponds to 27.5% guided and 66.7% strategic completions, but these are purely simulated outcomes.

## Small expansion and new controls (2026-10-13)

The original 32 cards, 15 Advisors, 8 combinations, 8 quarters, and 6 possible bosses remain unchanged. The mode adds replay choices without introducing another economy:

- **Standard**, **Advanced** (+12% target) and **Tycoon** (+25% target) difficulties. The difficulty is saved per run; existing `v1` runs without this field behave as Standard. Boss Inflation multiplies with the selected difficulty.
- **Suggest Discard** recommends up to three cards outside the current strongest four-card hand, but players decide whether to discard. Replacing cards is a tactical choice that can improve the win rate.
- A subtle hand-deal/replacement reveal adds ~185ms of fade/translate motion to the previous card-lift, score-pulse and quarter-transition animations. Reduced Motion disables all movement.
- The random shop no longer sells an already maxed (level 4) combination training upgrade.
- Advisor shop offers display rarity as a concise label rather than requiring new art.

### 60-seed challenge and discard benchmark

| Difficulty | No suggested discard | Cautious suggested discards |
| --- | ---: | ---: |
| Standard | 41/60 | 56/60 |
| Advanced | 21/60 | 48/60 |
| Tycoon | 13/60 | 23/60 |

These numbers use a separate heuristic test pilot (`empireCardsChallengeBalance.test.ts`): best-hand suggestions, a fixed Advisor/shop priority, and optional discard when below target pace. They **do not** represent real-player victory probabilities. The extra difficulties can be skipped entirely, and no rewards are introduced.

### Latest business parity follow-up

To reduce the Finance/Diversified advantage, **Venture Capitalist** now gives ×1.30 with Finance and **Family Holdings** gives ×1.45 for Diversified. Joint Venture is ×2.45 and Diversified Empire ×2.55. The specialist bonuses are slightly stronger: Specialization ×2.80 and Supply Chain / Startup Accelerator / Market Expansion ×2.95.

A 100-seed simulated full-run comparison now gives **34 Sales, 33 Operations, 62 Finance, 38 Innovation, and 66 Diversified wins**. All remain viable. Finance and Diversified still lead in this particular baseline; adjust further only if actual gameplay and larger sample testing confirm imbalance.

## Future work

1. Manual mobile playtesting: small phones, card text, one-handed actions, scrolling, help discoverability and save/resume.
2. Broader simulation policies, including deliberate discards, alternative deck specializations, and balancing against rare boss combinations.
3. Validate that Advisor synergies are understandable and no one Advisor is mandatory. Optional Advisor trade/swap mechanics can be explored.
4. Only introduce carefully capped main-game rewards once the simulation and gameplay experience are stable.
