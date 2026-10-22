# Life Empire — AdMob runtime QA (Android)
Updated: 2026-10-22

## Scope
The native production app has opt-in rewarded ads for Support Gems, Education, Business project Slot 2, Business upgrade Slot 2, plus a scheduled interstitial after every 80 **in-game weeks**. Remove Ads bypasses native ads and preserves account-wide daily claims. Web and Expo Go intentionally **simulate** ad completion; they cannot verify AdMob.

## Reproduce in a Google Play/internal-test Android build
1. Open Support → Help → **Ad Troubleshooting**. Verify mode is **Live Google AdMob** (not Google test ads or Web/Expo Go).
2. Tap **Check ad setup**. Ready means consent and the SDK can request ads, **not** that Google guarantees fill.
3. With a test account that has not purchased Remove Ads, open Support → Rewards → Watch Ad. Record whether the native ad opens and whether gems increase **once** only after Google's earned-reward event.
4. Start an education course; verify Watch Ad completes it once. Start one business project or upgrade and test Slot 2 separately.
5. Cancel a rewarded ad early: it must not grant a reward. Retry after a load failure; it must not stay busy.
6. Switch from Education to Support after an ad is ready. Another placement must be able to load without restarting the app.
7. To test a scheduled interstitial, use a controlled test save near the 80th, 160th, ... in-game week; after the weekly summary it should display or skip cleanly if unavailable. Any queued decisions must still appear.
8. Check Remove Ads purchase and Restore; verify no interstitials, and account-wide daily benefits work across save slots.

## If live ads do not appear
- Support → Help shows the last SDK failure category/code after an ad attempt. Capture the message and versionCode.
- AdMob console: verify this Android package, ad unit IDs, app status, payment/policy status, and EU consent/privacy messages. Fill is governed by Google; the app cannot force an impression.
- Check the Play Store developer-website hostname's **published** `/app-ads.txt` HTTP 200 response and AdMob's crawler status. The seller record exists in the `elroynbenjamins.github.io` GitHub repository, but that alone does not confirm the deployed response or AdMob validation.
- Ensure `EXPO_PUBLIC_AD_MODE` is **not** `test` in the release-build environment. `__DEV__` also uses Google test ads by design.
- In an Android development build, use **Google test ad units or registered test devices** for repeatable ad testing; don't repeatedly click live inventory on a developer-owned device.
- If consent/SDK is ready but there is **no fill**, inspect native `logcat` Google Mobile Ads error codes and AdMob fill/reporting. Network, ad inventory, policy and new unit activation are external to the repo.
- A native Android AAB rebuild and physical-device Play-install test are required to validate these code fixes; TypeScript/Jest cannot confirm live AdMob serving.

## Reliability safeguards in code
- Different rewarded placements no longer block one another due to an abandoned ready ad.
- Ready rewarded ads expire after four minutes.
- Granted rewards survive late native close/show errors, and the earned-reward callback is processed once.
- Timeout and native-listener failures release locks.
- Failed interstitials automatically resume the game instead of displaying a fake unavailable-ad screen.
- The Support troubleshooting panel reports ad mode, consent/SDK check and last failure code.
