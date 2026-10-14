# Upgrade and staffing tuning

Changes: future upgrade prices reduced 10% through the shared getUpgrade accessor; employee output contribution increased 5% in the canonical revenue-capacity formula. Salaries, upgrade revenue boosts and existing purchase histories are unchanged.

## Repeat release audit

Same five seeds and 12 types as the preceding audit, 3 employees, competition enabled. All 360 scenario runs stayed cash-positive.

| Years | Growth runs profitable after purchases | Fully upgraded growth runs |
| --- | ---: | ---: |
| 5 | 9/60 | 0/60 |
| 10 | 55/60 | 40/60 |
| 20 | 60/60 | 60/60 |

Previously: 2/60, 56/60 and 60/60 profitable after purchases. The year-10 count is not strictly better: bots now buy upgrades sooner, changing their cash-investment timing and random paths. Lowest year-20 cumulative operating profit minus upgrade purchases was 413,751 (coffee shop).

## Staffing and first-upgrade audit

108 additional 10-year simulations: 12 types, 3 seeds, baseline three staff versus up to six staff versus three staff and one paid upgrade. Every type had positive mean incremental profit net of the first upgrade cost (15,973 to 56,546). Across seeds, 29/36 first-upgrade scenarios recovered the purchase price relative to their paired idle baseline.

Fuller teams are not universally economical. Larger teams improved restaurant, construction and pharmacy mean profit, but hurt several smaller businesses. All three six-person coffee-shop and digital-agency runs entered negative cash. These teams include different roles and salaries, so the comparison is not a pure headcount effect. The requested modest productivity buff is implemented; hiring-balance work remains before claiming all staff expansion is healthy.

The bots start with operating cash equal to startup cost and preset employees. They are not beginner affordability tests. They do not model active hiring, management choices, full-game inflation or personal finances. No AAB was created and no gameplay save was modified.

To rerun staffing/single-upgrade checks in PowerShell:

```powershell
$env:BUSINESS_STAFFING_AUDIT='1'
yarn jest src/engine/__tests__/businessStaffingAudit.test.ts --runInBand
Remove-Item Env:BUSINESS_STAFFING_AUDIT
```
