# Recruitment pace and small-company payroll

- The first three free hires remain immediate.
- Paid recruitment recharges every 10 weeks at levels 0-1, 8 at level 2, 6 at level 3 and 5 thereafter.
- A matching next-hire cooldown prevents banked charges from bypassing pacing, including delegated hiring. The wait begins after the third free hire and each subsequent hire. Existing stored charges are retained.
- Small business types (base staff capacity at most 10), without acquisition scaling, receive a 5% regular-payroll discount per employee beyond three, capped at 11%. Full discount applies through level 2, halves at level 3, and ends at level 4.
- Individual salary contracts are preserved. The weekly expense calculation and employee cost display apply the discount; firing reverses the relevant discount automatically. Family governance, executives and corporate departments are excluded.
- The existing 10,000 paid recruitment fee is unchanged.

## Verification

For 2.2.0 (5% per employee / 11% cap), type checking and all 676 active tests passed. The 108-scenario staffing audit passed again, with all 36 larger-team runs keeping positive cash. Mean ten-year larger-team profit: coffee shop -58,423; digital agency -49,044; fitness gym +43,989; real estate agency +9,016. Positive remaining cash is not the same as profitability. Random event paths can diverge when the changed economics alter simulated decisions.

The simulation figures below describe the earlier 3% per employee / 9% cap baseline, not the revised 2.2.0 discount.

Unit and store tests cover recharge timing, immediate starter hires, banked-charge cooldown enforcement, payroll calculation, cap and taper. The staffing audit reruns 108 scenarios (12 types, 3 seeds, 3 policies, 10 years). All 36 fuller-team runs stayed cash-positive, versus 24/36 before the discount. Starting cash is funded and staffing is preset, so this audit measures payroll effects rather than the recruitment timeline.

Fuller teams still need demand: average 10-year six-person coffee-shop profit improves from -116,815 to -66,868; digital agency from -100,818 to -34,378; fitness gym from -109,272 to +22,065. This reduces the penalty for expansion, but does not guarantee that filling every position is profitable.
