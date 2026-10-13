# Empire Cards — visual identity guide

**Implementation:** `src/components/EmpireCardTile.tsx`, `src/theme/empireCardsVisuals.ts` and `app/empire-cards.tsx`.

The visual layer makes business departments recognizable at a glance without introducing new artwork downloads, rarity rules, gameplay stats or currencies.

## Department themes

| Department | Accent | Pattern | Icon family |
| --- | --- | --- | --- |
| Sales | Coral `#F07869` | Upward angled rays | Megaphones, shops, customers, promotions |
| Operations | Steel blue `#72A5EC` | Industrial square grid | Warehouses, fleets, factories, automation |
| Finance | Amber `#E6BD62` | Short ledger bars | Money, investing, acquisitions |
| Innovation | Violet `#B49AF2` | Circuit nodes | Research, coding, prototypes, technology |

The accent appears on a slim top strip, icon, point-badge outline and selection frame. The rest of the card uses the app's existing adaptive theme colors. Patterns have very low opacity and do not replace text.

## Each of the 32 cards

- Has its own mapped Ionicons glyph; no external image files
- Shows department label and icon, card title (maximum two lines), and numeric points prominently
- Uses a visual value band: **CORE** (20–24 points), **GROWTH** (26–30) or **FLAGSHIP** (32–34)
- Keeps the actual points and combo logic unchanged; these bands do **not** introduce random rarity or new gameplay rules
- Is a real accessible button with a descriptive label for screen readers

## Interactions and readability

- Selection: colored outline, checkmark and the original 120–145 ms lift animation
- Optional Strategy Hint: displays contextual guidance without highlighting, choosing or playing cards
- Discard mode: player chooses their own replacements; a free hint explains trade-offs but never suggests exact cards
- Boss card-value penalty: small warning icon only when the active boss actually reduces that department, omitted if Crisis Consultant protects the hand
- Compact phones: three cards per row below 380 logical pixels; otherwise four per row
- Honors the device's reduced-motion setting
- The live score preview continues to display actual scores, combination multipliers and Advisor contributions for the cards the player manually selects
- Advisor shop offers and equipped Advisor summary now use distinct small glyphs and rarity accent colors

## Quick tutorial and contextual help

The first time a player starts an Empire Cards run on a Life Empire save slot, a **five-step, non-modal and skippable** tutorial appears. A compact guide stays below the screen header so the underlying cards and controls remain usable. An accent outline highlights the relevant UI area.

1. Quarter score and target.
2. Selecting up to four cards.
3. Live combination and score preview.
4. Playing versus discarding.
5. Optional, non-automatic Strategy Hint.

One additional tip is shown **on first reaching the Investment Shop**, and another **upon first encountering a boss quarter**. Each includes Got it and Don't show again. Skipping the initial five-step walkthrough still permits those later tips; Don't show again permanently disables automatic tutorial prompts for that save slot. The player can use **How to Play / Replay Tutorial** manually, including after disabling automatic help. Manual replay cycles through all seven explanations even if the player is not currently in the related phase.

Tutorial completion is saved independently under `life-empire-cards-tutorial:v1:slot:<slot>`; it does not change run progress, score, card choices, main game currency, medals or balance. Missing/legacy preferences default to incomplete without changing existing runs.

An inline note underneath the first hand also reminds the player to try selecting cards and watch the preview update. The full Combination Guide remains optional.

Implementation: `src/engine/empireCardsTutorial.ts`, `src/components/EmpireCardsCoach.tsx`, `app/empire-cards.tsx`. Regression coverage: `src/engine/__tests__/empireCardsTutorial.test.ts`.

## Future art pass

If a full custom art pass is ever desired, retain the existing top-strip/point-badge/title/footer anatomy. Replace only the icon region with consistent mini-illustrations, starting with four sample cards. Do not generate 32 independent art pieces before validating readability on actual 360–390px devices.

## Regression checks

- `src/engine/__tests__/empireCardsVisuals.test.ts`: exact 32-card coverage, 15 Advisor glyphs, tier mapping, department patterns and correctly scoped boss warnings
- `src/components/__tests__/EmpireCardTile.test.tsx`: rendering, control accessibility, hint states and selection
- Standard scoring and eight-quarter simulation tests remain unchanged
