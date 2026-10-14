# Business bot audit

Run in PowerShell:

```powershell
$env:BUSINESS_BOT_AUDIT='1'
yarn jest src/engine/__tests__/businessBot.test.ts --runInBand
Remove-Item Env:BUSINESS_BOT_AUDIT
```

The normal test suite tests bot spending and project scheduling but skips the longer audit.

## Policies

- Idle: no discretionary actions.
- Upkeep: repair the worst eligible condition below 75, retaining eight weeks of reported expenses or 10,000 cash, whichever is greater.
- Growth: upkeep first, then the cheapest affordable unowned upgrade. Uses one upgrade slot.
- No-wear diagnostic: reset all three condition tracks weekly, at no cost. This is not a playable strategy.

Bots use real upgrade definitions, maintenance costs, eligibility, reserve consumption and completion timers. Every purchase records its week, target and cost. They run in memory and do not modify saves.

## Initial results

Three seeds per policy and business, 400 weeks (20 game years), competition enabled. Rounded mean cumulative operating profit, excluding capital purchase spending:

| Business | Idle | Paid upkeep | Paid growth | No wear diagnostic |
| --- | ---: | ---: | ---: | ---: |
| Coffee shop | -36,485 | -36,656 | -175,656 | -45,755 |
| Software | -136,863 | -146,277 | 97,897 | 529,462 |
| Construction | 252,132 | 251,943 | 124,636 | 381,198 |

Mean upkeep purchases cost 41,250, 66,000 and 256,667 respectively. Mean ending company cash under paid upkeep was 3,744, -53,986 and 122,787 respectively. Cash includes the initial reserve and other engine cash flows, so it is not identical to operating profit minus purchases.

Maintenance costs have a floor of 55% of the business type's startup price **per area**, before inflation. Fully neglected conditions can reduce revenue by up to 15%, increase expenses by up to 12%, and additionally affect reputation and crises. These results suggest maintenance pricing and timing need attention; removing penalties alone does not fix every business.

## Limits

These are business-policy bots, not whole-game autonomous players. They begin with three simulator-generated employees and cash equal to startup price, excluding the personal purchase cost. No replenishment, hiring, loans, projects, expansion, active decision handling or personal-life actions are modeled. Economic prices remain constant. Insolvent runs continue for measurement; never-negative cash is recorded separately. The free-condition diagnostic affects technology, equipment and premises together, not technology alone. Random paths can diverge after actions; three seeds are exploratory evidence, not a causal estimate or final balance certification. No gameplay economics were changed by this audit.
