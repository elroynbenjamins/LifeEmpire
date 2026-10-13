# Empire Cards — balance baseline (2026-10-13)

This document records the initial release balance and implementation goals for **Empire Cards**, an optional, static (no-animation) roguelite activity inside Life Empire.

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

The Inflation boss raises its quarter target by 20%. The other bosses primarily alter card values or cap the base combination multiplier. Crisis Consultant protects boss card values and adds +20 base points during boss quarters, but does not waive the Inflation target increase.

## Shops and card decisions

- Quarter rewards: 7 Run Capital plus 2 per unused hand; Tax Specialist adds another 2.
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
| Quarter 3 | 63 | 120 | 120 |
| Quarter 4 | 25 | 118 | 120 |
| Quarter 5 | 13 | 118 | 120 |
| Quarter 6 | 3 | 92 | 112 |
| Quarter 7 | 0 | 51 | 105 |
| Quarter 8 | 0 | 26 | 73 |

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

A small mobile UI improvement displays which Advisors contributed to the currently selected hand and flags Venture Capitalist's no-Finance penalty. The change does not add animations or new saved-state requirements.

The *intermediate* first Advisor reduction made quarter eight excessively hard (3/120 guided wins). The finale was therefore recalibrated to 1,950 in quarter seven and 2,100 in quarter eight, preserving a difficult but achievable late game with multiple conditional scoring approaches.

## Future work

1. Manual mobile playtesting: small phones, card text, one-handed actions, scrolling, help discoverability and save/resume.
2. Broader simulation policies, including deliberate discards, alternative deck specializations, and balancing against rare boss combinations.
3. Validate that Advisor synergies are understandable and no one Advisor is mandatory. Optional Advisor trade/swap mechanics can be explored.
4. Only introduce carefully capped main-game rewards once the simulation and gameplay experience are stable.
