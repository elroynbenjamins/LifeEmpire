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
| 7 Holding Formation | 2,120 | 4 | 3 | No |
| 8 Global Business Empire | 2,500 | 4 | 3 | Yes |

The Inflation boss raises its quarter target by 20%. The other bosses primarily alter card values or cap the base combination multiplier. Crisis Consultant protects boss card values and adds +20 base points during boss quarters, but does not waive the Inflation target increase.

## Shops and card decisions

- Quarter rewards: 7 Run Capital plus 2 per unused hand; Tax Specialist adds another 2.
- Two distinct Advisor offers, one random combination upgrade, one improved card offer.
- Advisor slots stay limited to four.
- Optional combination-specific training (level 1–4) costs 7/9/11/13 Capital and increases that combo's multiplier by 0.25 per level.
- Optional card retirement (up to 4 cards, never fewer than 20 total) costs 4/6/8/10 Capital.
- Rerolling offers costs 2 Run Capital.
- A free **Suggest Best Hand** action highlights an optimal scoring four-card selection within the current hand but does **not** auto-play or spend resources.
- Seeded randomness uses high-order pseudorandom bits to avoid patterned shuffles.

## Benchmark: 120 deterministic seeds per simulated playstyle

| Completed through | Basic first-4 player | Guided (best-hand suggestion, simple shop) | Strategic (best hand, targeted shops) |
| --- | ---: | ---: | ---: |
| Quarter 1 | 120 | 120 | 120 |
| Quarter 2 | 117 | 120 | 120 |
| Quarter 3 | 62 | 120 | 120 |
| Quarter 4 | 30 | 118 | 120 |
| Quarter 5 | 22 | 118 | 119 |
| Quarter 6 | 8 | 86 | 109 |
| Quarter 7 | 1 | 55 | 92 |
| Quarter 8 | 0 | 24 | 69 |

Scripted results are **not human player win rates**. These are regression benchmarks from `src/engine/__tests__/empireCardsBalance.test.ts` and should be rerun after any scoring, target, shop, or deck-size changes.

The basic player chooses the first four cards and buys the first affordable Advisor. The guided player chooses the highest-scoring four-card hand and buys the first affordable Advisor. The strategic player additionally prioritizes multiplicative Advisors and Diversified Empire combo training.

## Future work

1. Manual mobile playtesting: small phones, card text, one-handed actions, scrolling, help discoverability and save/resume.
2. Broader simulation policies, including deliberate discards, alternative deck specializations, and balancing against rare boss combinations.
3. Validate that Advisor synergies are understandable and no one Advisor is mandatory. Optional Advisor trade/swap mechanics can be explored.
4. Only introduce carefully capped main-game rewards once the simulation and gameplay experience are stable.
