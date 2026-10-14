# Beginner guidance, business simplification and recovery

## Scope

Keep core companies and holdings. Advanced company sections, Holding policy controls,
shared services and management reports remain available through Advanced management.
No version bump, signing change, build, commit or push was performed.

## Changes

- Retired active Insurance & Risk controls, policy premiums, insured incidents and
  the insurance achievement. Existing saved claims and historical records remain
  readable, and already-earned rewards are not clawed back.
- Business warnings now cover every negative balance, recur next week or when a
  snoozed balance worsens, and suggest the actual shortfall plus four weeks of
  current cash losses. Interest already included in profit is not counted twice.
- Recovery distinguishes operating loans from corporate credit lines and bonds.
  Eligibility and terms remain enforced. Failed and partial funding do not dismiss
  an unresolved deficit. Players can raise personal cash through investments,
  property sales or banking, or fund a subsidiary through Holding treasury.
- Holding funding and allocation choices include current cash shortfalls.
- Three lower-cost initial courses, cash-after-tuition and student-budget previews;
  all career paths remain accessible. Existing course durations and tuition remain.
- Career is a main tab; Statistics and Real Estate are available from Home.
  First-life guidance continues beyond Year 1 until a career starts.
- Graduation uses current career-path names and explains vehicle delivery.
  Enrollment stays on Education. The weekly-result lesson appears inside the
  actual summary and completes when the player continues.
- Shorter business/holding guidance, optional market/property tours, collapsed
  economic-cycle detail and a simpler first-business screen.
- WeekAd shares concurrent loads, reuses a ready ad, releases failed native shows,
  retries transient consent failures and waits for blocking reports/events.
  Existing Remove Ads entitlement and 100-game-week frequency are unchanged.

## Verification

- TypeScript: passed.
- Full Jest run: 76 suites passed, 654 tests passed; 2 existing skipped suites /
  4 skipped tests. No failures.
- After the final shared-tour markup fix: typecheck and both affected tour suites
  passed (12 tests).
- Browser: isolated localhost saves, mobile 390 x 844 and desktop 1280 x 800.
  Verified enrollment, student work, first-week summary lesson and completion,
  Year-2 transport guidance, simplified business entry, market tour and property
  access/tour. Fixed nested button markup found during that walkthrough.
- Screenshot: ../artifacts/qa/weekly-report-guidance-mobile.png

## Native verification still required

Web and Expo Go simulate ads. Native Android testing is still needed to verify
actual AdMob delivery, consent configuration and that the WeekAd unit is configured
as an interstitial in AdMob. The code uses the existing Android WeekAd unit ending
in /8313507771; no ad-unit IDs were changed. SDK mock tests verify lifecycle and
queueing behavior, not production ad availability.
