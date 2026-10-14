# Business balance: upkeep disabled

## Changes

- Technology, equipment and premises condition no longer decays or affects revenue, expenses, reputation, crises or valuation.
- New refresh purchases are blocked. Already-paid projects finish on their existing timers; legacy save fields are preserved.
- The Upkeep tab and refresh controls are removed. Old section links open Overview.
- Upkeep reserve targets and earmarks are released without adding or removing company cash. Reports no longer flag current maintenance backlogs.
- Optional business upgrades remain. Their individual revenue benefits now use their definitions, capped between 8% and 16%, instead of every upgrade providing 2%. The existing diminishing-returns formula remains.
- Coffee shops, food trucks, digital agencies, auto repair, real-estate agencies and bakeries receive 10% more baseline demand capacity and starter-contract support. Acquisition baselines are excluded from this adjustment.

## Final bot audit

72 runs: all 12 business types, three deterministic seeds, idle and paid-growth policies, 400 weeks (20 game years). All runs stayed cash-positive. Every growth run purchased the full five-upgrade set. Mean cumulative operating profits and total upgrade costs:

| Business | Idle profit | Growth profit | Upgrade purchases |
| --- | ---: | ---: | ---: |
| Coffee shop | -33,792 | 787,902 | 160,000 |
| Food truck | 74,712 | 823,130 | 97,500 |
| Restaurant | 425,155 | 1,328,819 | 415,000 |
| Clothing store | -69,756 | 770,564 | 235,000 |
| Software | 529,462 | 1,222,002 | 375,000 |
| Fitness gym | 165,643 | 956,420 | 295,000 |
| Construction | 381,198 | 1,890,102 | 390,000 |
| Digital agency | 560,863 | 1,084,203 | 210,000 |
| Pharmacy | 504,215 | 1,669,592 | 300,000 |
| Auto repair | 87,911 | 550,554 | 220,000 |
| Real-estate agency | -3,883 | 840,298 | 300,000 |
| Bakery | 301,358 | 969,040 | 130,000 |

Profits exclude upgrade purchase costs. Growth bots pay those costs from actual cash before scheduling upgrades; no free completion or additional cash injections occur. All types have positive mean profit after subtracting upgrade purchases. Idle businesses are not guaranteed to be profitable.

## Limits

Starting operating cash equals the business type's startup price, and three simulator-generated employees are provided. Personal acquisition costs, full-game inflation, active staffing changes, loans, projects and expansion are not modeled. Random paths diverge after actions. This is an exploratory long-term policy comparison, not a guarantee of beginner affordability or profitability for every seed.

Rerun with the PowerShell command in business-bot-audit.md. The opt-in bot audit now covers all 12 types with idle and growth policies; its earlier results document the pre-change baseline.
