# Beginner Experience Review

Date: 2026-09-29. Reviewed release source: `6a26550` (2.1.1 / 214).

## Verdict

The guided opening teaches the first weekly loop, but guidance is not yet enough for a beginner to confidently move into the major systems. The largest problems are contradictory handoffs, premature exposure to advanced controls, and missing explanations of the consequences of a choice. More tutorial paragraphs alone would not solve them.

Reduce the number of decisions presented at once. Preserve the underlying depth initially, then use playtesting to decide which mechanics should actually be merged or removed.

## What Was Tested

- Created a separate local web save named Beginner Review on port 8091. Enabled Personal Life.
- Followed all six guided-opening steps: Retail Basics, High-Hours Part-Time, first weekly report, finish guide.
- Advanced normally through 21 weeks, without education boosts, to graduation in Year 2 Week 2. Followed the graduation prompt into Career and opened the matching path.
- Inspected the Business entry screen and founding catalogue, Market and a stock's trade screen, and Personal Life setup, Dating and Family screens.
- Inspected screenshots at desktop size and 390 x 844 for phone-scale presentation.
- Read the implementation of business and holding tours, founding/funding, real estate, career requirements, first-life goals and reference help.
- Business ownership, holdings, property purchases, later relationships and succession were assessed from source, not played through to completion. Native Android ads, safe areas and touch behavior were not retested here. This is an expert walkthrough, not a study with first-time players.
- No gameplay code, release configuration or player data outside the separate web test save was changed.

## Prioritized Findings

### 1. High: Graduation advice disagrees with actual job requirements

Observed: after Retail Basics completed, the popup said "You can now visit Career and apply for Cashier." Career instead showed Sales Associate, and the application was blocked with "Need a car first."

Cause: `src/engine/weeklyTick.ts:467` builds the reminder using legacy `jobsData`, including its `requiresCar` field. `app/tabs/career.tsx:235` and the store's career command use the newer career requirements, including a used car at entry level.

Change: derive graduation advice from the same career eligibility calculation used by applications. Show the actual entry job and the next missing requirement. Link directly to Transport when that is the blocker, then back to the relevant career once delivery completes.

### 2. High: A new player has no discoverable route into investment property

The only navigation link to `/properties` found in the app/components source is the Home card at `app/tabs/index.tsx:358`, which renders only when `properties.length > 0`. The route and purchase screen exist, but a player with zero properties needs a route to buy the first one. The How To Play paragraph is not a navigation link.

Change: add a permanent entry under a clearly named investing or assets destination. Its empty state should explain the first purchase and savings target. Keep investment properties distinct from personal housing.

### 3. High: The first-life checklist ends before the first career

Observed: the checklist disappeared at Year 2 Week 1 while Retail Basics was still at 20/21 weeks. Graduation and the vehicle blocker came afterward.

Cause: `src/engine/firstLifeJourney.ts:140` hides the whole journey once Year 1 ends. Every Basic course takes more than 20 weeks with High-Hours Part-Time; Retail Basics takes 21 and Marketing takes 31. Several also exceed 20 weeks with Flexible work.

Change: retire the introductory journey on meaningful completion or explicit dismissal, not the year boundary. Preserve an obvious next action through graduation, transport delivery, application and the first full-time paycheck. Keep later optional goals separate.

### 4. Medium: The result lesson appears after the result is dismissed

Observed: the first actual weekly result was +EUR272; the forecast was +EUR330. The guide was absent during the report. After Continue, "Read the result and keep building" appeared on Home and highlighted the forecast.

Cause: `src/components/TutorialDock.tsx:41` suppresses the dock during summaries; `src/engine/tutorialEngine.ts:10` targets `home.cashflow` for the result step.

Change: teach within the first summary, or provide a way to reopen that exact result. Explain projected versus actual income with the player's numbers. Do not label the next forecast as the result.

### 5. Medium: Course and work choices lack a combined budget preview

Observed: ten Basic courses are offered. Marketing is marked Ready at EUR9,000 out of EUR10,000 starting cash. Software Development costs EUR11,000 and is unaffordable. The guide tells the player to choose a direction but does not show its financial runway or a savings-first route.

Starting recurring bills are EUR395/week. Flexible income averages EUR350, leaving an expected EUR45 weekly deficit; High-Hours averages EUR725, leaving EUR330 before changes/events. The work descriptions explain the time tradeoff, but the player must combine figures from separate screens. This matters particularly after an expensive course purchase.

Change: compare course cost, cash remaining, expected net weekly income, actual study duration with the selected job, and the eventual transport requirement together. Offer a small suggested starter selection with all courses still accessible. Work-before-study should be a clear option for an unaffordable course.

Additional friction: first enrollment redirects Home (`app/tabs/education.tsx:98`) even though the next guide step requires Education again. Keep the player with the newly enrolled course until that step is finished.

### 6. High Design Priority: Business asks for advanced understanding before the first success

Observed before ownership: an empty empire shows group equity, debt, acquisitions and holdings. The founding screen leads with a large company-capacity panel explaining PP, gems and rewarded ads despite having two unused free slots. The cheapest business is EUR50,000, versus EUR10,000 starting cash.

Source review after ownership: all eight section tabs are present (`app/business/[id].tsx:208`). The three-step optional business tour covers balances, team and cash transfers, but not a complete hire -> run week -> interpret profit loop. Its cash lesson already discusses protected reserves, co-ownership and subsidiaries.

Founding affordability checks only the startup purchase. A new company starts with zero cash and zero employees (`src/engine/businessEngine.ts:1323`), needs three staff to earn revenue, and immediately presents funding choices, including a EUR50,000 loan. The funding explanation exists, but arrives after the startup money is spent; the prominent loan button does not display its rate, term or weekly payment alongside it.

Change: before founding, preview startup cost, a useful operating-cash estimate and personal cash remaining. After founding, focus on company cash, staffing readiness and weekly profit. Guide the player through funding, recruiting the initial team, one operating week and reading the result. Introduce growth choices afterward. Keep advanced sections reachable through More/Advanced and surface critical obligations when they matter. Hide extra-slot promotions until capacity is relevant.

### 7. Medium: Investing and property have reference text, not an introductory loop

Market immediately shows the economic cycle, rates, IPO labels and a mixed asset list. The inspected stock screen provides price history and trade quantity/total controls, but no first-visit sequence teaching cash committed, possible loss, or where to review the position next.

Property listings already show price, rent and net income, which is a useful foundation. Auctions add inspections, bidding and competition without a dedicated guided chapter. Only the opening, business and holding chapters exist in the tutorial engines.

Change: offer a short optional first-position guide with a small user-chosen purchase, cash-left preview and portfolio follow-through. Do not require a trade. For property, teach buy -> rent out -> net result first; introduce auctions separately. Put economic-cycle detail behind an expandable explanation until the player needs it.

### 8. Lower Priority: Navigation and lesson length add unnecessary work

Career is part of the essential opening but is hidden from the bottom tabs (`app/tabs/_layout.tsx:72`), while Statistics has a permanent tab. It can be reached through the guide, the income tile and Home links, but the information hierarchy does not match the early game.

Some lesson text explains guide mechanics rather than the game: highlighted controls being examples, Show me behavior, and repeated assurances that a lesson does not require a transaction. Keep the optional nature clear once; make each step primarily one decision and its consequence.

## Major-System Assessment

| System | Assessment | First useful loop to teach |
| --- | --- | --- |
| Education and career | Best covered, but graduation handoff is inconsistent and checklist expires early | Choose course/work -> afford study -> graduate -> meet transport requirement -> earn first career paycheck |
| Business | Largest complexity mismatch | Fund -> recruit initial staff -> operate one week -> understand company profit and cash |
| Market | Usable controls, weak beginner context | Inspect asset -> choose affordable exposure -> review portfolio after a week |
| Property | Entry-point defect; basic listing numbers are helpful | Find property -> compare net income -> buy -> rent out -> review result |
| Personal Life | Better initial pacing | Set preferences -> choose a date -> understand feedback and next available action |
| Holdings/acquisitions | Advanced reference tours, not beginner material | Explain why a group is useful before reserve targets, fees and allocation |
| Prestige/succession | Best introduced at relevant milestones | Explain the immediate benefit or inheritance decision in the context of the current life |

Personal Life is optional, starts with straightforward preferences and dated activities with visible prices, and withholds estate planning until marriage or children. Preserve that progressive approach. Later relationship and succession clarity still needs a dedicated playthrough.

## Recommended Simplification

1. Repair the broken handoffs first: graduation eligibility, real-estate access, persistent first-life goals and the report lesson.
2. Make the opening focus on one next action, cash after costs, course progress and the first career. Make Career prominent; move Statistics and other secondary destinations under More.
3. Replace the business empty-state empire dashboard with a first-business starting point and a savings/funding preview. Start company management with Overview, Team and Cash Flow; keep the rest under Advanced until relevant.
4. Defer slot upsells, company ownership structures, corporate departments, holdings, acquisitions and detailed capital allocation until they serve an actual decision. Do not silently leave hidden risks running without an actionable alert or sensible default.
5. Introduce one optional system after the player achieves stable income, based on their interest. Avoid adding another long compulsory tour.
6. Playtest a shorter first qualification. The current 21-week Retail/High-Hours route requires roughly 42 advance/continue taps before the vehicle and job steps. An initial 4-6-week qualification is a candidate experiment, not a validated balance change; check tuition, student income, course rewards, age progression and boost value together.

Candidates for later consolidation: overlapping business projects/upgrades/expansion choices; repeated budget/reserve controls; multiple automation entry points. First group these coherently, then test which distinct decisions are enjoyable enough to retain. Do not remove whole systems solely on this walkthrough.

## Acceptance Checks For The Next Pass

- A fresh player can name their next action and explain whether they are gaining or losing cash without visiting Statistics.
- Following graduation advice leads to an available action, or to the exact missing requirement with a direct route.
- A slower student retains guidance into Year 2 and can reach the first career without opening reference help.
- The report lesson refers to the same numbers currently visible in the report.
- A player with no properties can discover property listings through ordinary navigation.
- A first-time founder sees the operating-cash requirement before committing startup funds and can reach the first staffed operating week with contextual guidance.
- Optional systems and ads never appear to be required to complete the introductory loop.
- Repeat on native Android with a small phone and larger text, then observe first-time players; web inspection alone cannot validate that experience.
