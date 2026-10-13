# Life Empire — Standalone Minigame Roadmap

Status: proposed concepts, **not implemented** unless explicitly marked otherwise. This is a design reference, not a promise of shipping content.

## Principle

Minigames should be genuinely interactive and meaningfully different from the main Life Empire week-by-week simulation. Support short and longer sessions without forcing a player to create or advance a main life save.

- Play from the title menu where practical; existing saves may also have a shortcut.
- Store standalone progress separately from Life Empire's three life saves.
- No transfer of main-game cash, gems, prestige points, time, paid entitlements or other gameplay resources until explicitly designed and balanced.
- Allow resume where appropriate, a short skippable tutorial, a combination/rules guide and optional cosmetic-only achievements/challenges.
- UI stays compact on 360px-wide Android screens, with motion kept subtle and accessible.
- Prefer deterministic seeded engine tests with diverse bot strategies and real-device usability testing before expanding a mode.

## Available: Empire Cards (standalone + in-save)

Eight-quarter business-combination card roguelite, 32 starting cards, 15 Advisors, 8 combinations, 6 potential boss conditions, 3 difficulties, cosmetic achievements/challenges and guided onboarding.

- In-save: original `life-empire-cards:v1:slot:<slot>` family of keys.
- Standalone from main menu: `life-empire-cards:v1:standalone` plus separate medal/tutorial keys, without creating a life save.
- No cloud sync in the current build; device-local progress only.

## Prioritized proposals

| Priority | Mode | Session | Core decision | Distinction from main simulation |
| --- | --- | --- | --- | --- |
| 1 | **Auction Showdown** | 2–5 min | Raise, call bluff, drop out or win at a good valuation under a bidding timer/turn cap | Competitive AI bidding with distinct opponent strategies |
| 2 | **Startup Sprint** | 10–20 min | Choose hiring, products, marketing, research and financing across 12–20 rounds | Compact business-builder campaign, randomized scenarios |
| 3 | **Property Flip** | 5–12 min | Inspect, bid, renovate or sell under changing local conditions | Budget/risk puzzle rather than steady ownership |
| 4 | **Corporate Crisis** | 8–15 min | Survive a sequence of difficult board decisions with linked consequences | Narrative branch and risk management |
| 5 | **Business Dynasty** | 30–60+ min | Preserve ownership and build a legacy through multiple generations | Focused succession/holding-company campaign, independent save |

### Auction Showdown — first new mode to prototype

Use the existing property/business auction foundations where reusable, but treat this as a separate, score-based bidding game, not a copy of the weekly in-save auction. Test 3 AI personalities (conservative, aggressive and opportunist) plus randomized valuations, hidden bidder budgets, a fixed bidding budget and explicit walk-away decisions. Score based on discounts against an estimated fair valuation, not simply winning the most lots. Avoid pure random wins or monetized bidding energy.

### Startup Sprint — first longer mode to prototype

Each standalone run covers 12–20 rounds, each with one key strategic business decision, cashflow and competitor response. Four starting sectors; random market circumstances; optional objective and simple end-of-run rating. Actions should have understandable delayed effects, so the player must balance liquidity, growth and staff/reputation. Keep this distinct from the main save's long term businesses and prestige system.

### Others

**Property Flip:** make hidden flaws discoverable by spending on inspections, limit capital and renovations and have meaningful selling timing.

**Corporate Crisis:** 8–12 branching dilemmas with visible confidence, debt, reputation and staffing indicators. Avoid frequent fake choice pop-ups; consequences persist.

**Business Dynasty:** deeper optional campaign using family governance and inheritance but not the main save's family assets. Requires the most balancing and onboarding, so do last.

## Packaging / progression

Once there are at least 2 implemented minigames, consider replacing the title-screen direct Empire Cards link with a dedicated **Minigames** hub and cards for **only actually playable** modes. In-save entry can remain a shortcut to Empire Cards. Consider device-local best-run records and mode-specific medals first; account sync and global cross-save collection can be designed later. Do not imply data moves between modes unless it really does.
