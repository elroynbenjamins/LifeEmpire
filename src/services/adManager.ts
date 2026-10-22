import { Platform } from 'react-native';
import { AD_CONFIG, RewardedAdPlacement } from './adConfig';
import { canRequestAds } from './adPrivacyManager';
import { loadGoogleMobileAdsModule } from './nativeAdsModule';

type AdState = 'idle' | 'loading' | 'ready' | 'showing' | 'error';
type Listener = (state: AdState) => void;
type Unsubscribe = () => void;

const REWARDED_LOAD_TIMEOUT_MS = 15000;
const REWARDED_SHOW_TIMEOUT_MS = 120000;
const REWARDED_READY_MAX_AGE_MS = 4 * 60 * 1000;
const INTERSTITIAL_LOAD_TIMEOUT_MS = 15000;

let adState: AdState = 'idle';
let rewardedAd: any = null;
let rewardedAdEventType: any = null;
let rewardedBaseEventType: any = null;
let rewardedPlacement: RewardedAdPlacement | null = null;
let rewardedReadyAt = 0;
let lastAdIssue: string | null = null;
let listeners: Listener[] = [];
let interstitialAd: any = null;
let interstitialLoading = false;
let interstitialShowing = false;

function setAdState(next: AdState) {
  adState = next;
  listeners.forEach((listener) => listener(adState));
}

function clearRewardedAd(nextState: AdState) {
  rewardedPlacement = null;
  rewardedReadyAt = 0;
  rewardedAd = null;
  rewardedAdEventType = null;
  rewardedBaseEventType = null;
  setAdState(nextState);
}

function productionRewardedUnit(placement: RewardedAdPlacement): string {
  if (placement === 'education') return AD_CONFIG.EDUCATION_REWARDED_AD_UNIT_ID_ANDROID;
  if (placement === 'business_project_slot') return AD_CONFIG.BUSINESS_PROJECT_SLOT_REWARDED_AD_UNIT_ID_ANDROID;
  if (placement === 'business_upgrade_slot') return AD_CONFIG.BUSINESS_UPGRADE_SLOT_REWARDED_AD_UNIT_ID_ANDROID;
  if (placement === 'business_company_slot') return AD_CONFIG.BUSINESS_COMPANY_SLOT_REWARDED_AD_UNIT_ID_ANDROID;
  return AD_CONFIG.GEM_REWARDED_AD_UNIT_ID_ANDROID;
}

export function getAdState(): AdState {
  return adState;
}

/** Safe status for user-initiated troubleshooting (no ad or account identifiers). */
export function getLastAdIssue(): string | null { return lastAdIssue; }

function noteAdIssue(phase: string, error?: unknown) {
  const code = error && typeof error === 'object' && 'code' in error &&
    (typeof error.code === 'number' || typeof error.code === 'string')
    ? String(error.code).slice(0, 40) : '';
  lastAdIssue = code ? `${phase} (code ${code})` : phase;
}

export function subscribeAdState(fn: Listener): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((listener) => listener !== fn); };
}

export async function loadRewardedAd(placement: RewardedAdPlacement): Promise<boolean> {
  // A ready ad may survive screen navigation. Reuse it only for the placement
  // that requested it, otherwise discard it rather than block every other reward.
  // Never interrupt an ad currently loading or showing.
  if (adState === 'loading' || adState === 'showing') {
    noteAdIssue('Another rewarded ad is still in progress');
    return false;
  }
  if (adState === 'ready') {
    if (rewardedPlacement === placement && Date.now() - rewardedReadyAt < REWARDED_READY_MAX_AGE_MS) return true;
    clearRewardedAd('idle');
  }
  lastAdIssue = null;
  setAdState('loading');

  try {
    if (!(await canRequestAds())) {
      noteAdIssue('Advertising unavailable: consent or SDK initialization');
      clearRewardedAd('error');
      return false;
    }

    const {
      RewardedAd,
      RewardedAdEventType,
      AdEventType,
    } = await loadGoogleMobileAdsModule();

    const adUnitId = AD_CONFIG.USE_TEST_ADS
      ? (Platform.OS === 'ios' ? AD_CONFIG.REWARDED_TEST_AD_UNIT_ID_IOS : AD_CONFIG.REWARDED_TEST_AD_UNIT_ID_ANDROID)
      : (Platform.OS === 'ios' ? AD_CONFIG.REWARDED_TEST_AD_UNIT_ID_IOS : productionRewardedUnit(placement));

    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;
      let loadSub: Unsubscribe | null = null;
      let errorSub: Unsubscribe | null = null;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        loadSub?.();
        errorSub?.();
      };

      const settle = (success: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();

        if (success) {
          rewardedAd = ad;
          rewardedPlacement = placement;
          rewardedReadyAt = Date.now();
          lastAdIssue = null;
          rewardedAdEventType = RewardedAdEventType;
          rewardedBaseEventType = AdEventType;
          setAdState('ready');
        } else {
          if (!lastAdIssue) noteAdIssue('Rewarded ad could not load');
          clearRewardedAd('error');
        }
        resolve(success);
      };

      loadSub = ad.addAdEventListener(RewardedAdEventType.LOADED, () => settle(true));
      errorSub = ad.addAdEventListener(AdEventType?.ERROR ?? 'error', (error: unknown) => {
        noteAdIssue('Rewarded ad load failed', error);
        settle(false);
      });
      timeout = setTimeout(() => { noteAdIssue('Rewarded ad load timed out'); settle(false); }, REWARDED_LOAD_TIMEOUT_MS);

      try {
        ad.load();
      } catch (error) {
        noteAdIssue('Rewarded ad load threw', error);
        settle(false);
      }
    });
  } catch (error) {
    noteAdIssue('Rewarded ad initialization failed', error);
    clearRewardedAd('error');
    return false;
  }
}

export async function showRewardedAd(onReward: () => void | boolean): Promise<boolean> {
  if (adState !== 'ready' || !rewardedAd || !rewardedAdEventType) return false;
  if (Date.now() - rewardedReadyAt >= REWARDED_READY_MAX_AGE_MS) {
    noteAdIssue('Rewarded ad expired before showing');
    clearRewardedAd('error');
    return false;
  }

  const ad = rewardedAd;
  const rewardedEvents = rewardedAdEventType;
  const baseEvents = rewardedBaseEventType;
  setAdState('showing');

  return await new Promise<boolean>(async (resolve) => {
    let settled = false;
    let rewardGranted = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let earnSub: Unsubscribe | null = null;
    let closeSub: Unsubscribe | null = null;
    let errorSub: Unsubscribe | null = null;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      earnSub?.();
      closeSub?.();
      errorSub?.();
    };

    const settle = (earned: boolean, nextState: AdState) => {
      if (settled) return;
      settled = true;
      cleanup();
      clearRewardedAd(nextState);
      // Once granted by the SDK, an ad error/late close must not tell the
      // screen the user failed to earn a reward.
      resolve(earned || rewardGranted);
    };

    earnSub = ad.addAdEventListener(rewardedEvents.EARNED_REWARD, () => {
      if (rewardGranted || settled) return;
      try {
        // Explicit false means the game rejected an ineligible claim; void
        // callbacks remain valid for education and business unlocks.
        rewardGranted = onReward() !== false;
      } catch (error) {
        noteAdIssue('The ad completed but the reward could not be applied', error);
      }
    });
    closeSub = ad.addAdEventListener(baseEvents?.CLOSED ?? 'closed', () => settle(rewardGranted, 'idle'));
    errorSub = ad.addAdEventListener(baseEvents?.ERROR ?? 'error', (error: unknown) => {
      if (!rewardGranted) noteAdIssue('Rewarded ad playback failed', error);
      settle(false, 'error');
    });
    timeout = setTimeout(() => {
      if (!rewardGranted) noteAdIssue('Rewarded ad playback timed out');
      settle(false, 'error');
    }, REWARDED_SHOW_TIMEOUT_MS);

    try {
      await ad.show();
    } catch (error) {
      if (!rewardGranted) noteAdIssue('Rewarded ad could not be shown', error);
      settle(false, 'error');
    }
  });
}

let interstitialLoadPromise: Promise<boolean> | null = null;

export function loadInterstitialAd(): Promise<boolean> {
  if (interstitialLoadPromise) return interstitialLoadPromise;
  interstitialLoadPromise = requestInterstitialAd().finally(() => { interstitialLoadPromise = null; });
  return interstitialLoadPromise;
}

async function requestInterstitialAd(): Promise<boolean> {
  if (interstitialAd && !interstitialShowing) return true;
  if (interstitialLoading || interstitialShowing) return false;
  interstitialLoading = true;

  try {
    if (!(await canRequestAds())) {
      interstitialLoading = false;
      return false;
    }

    const { InterstitialAd, AdEventType } = await loadGoogleMobileAdsModule();
    const unitId = AD_CONFIG.USE_TEST_ADS
      ? (Platform.OS === 'ios' ? AD_CONFIG.INTERSTITIAL_TEST_AD_UNIT_ID_IOS : AD_CONFIG.INTERSTITIAL_TEST_AD_UNIT_ID_ANDROID)
      : (Platform.OS === 'ios' ? AD_CONFIG.INTERSTITIAL_TEST_AD_UNIT_ID_IOS : AD_CONFIG.SCHEDULED_INTERSTITIAL_AD_UNIT_ID_ANDROID);
    const ad = InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true });

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;
      let loadedSub: Unsubscribe | null = null;
      let failedSub: Unsubscribe | null = null;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        loadedSub?.();
        failedSub?.();
      };
      const settle = (success: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        interstitialLoading = false;
        interstitialAd = success ? ad : null;
        resolve(success);
      };

      loadedSub = ad.addAdEventListener(AdEventType.LOADED, () => settle(true));
      failedSub = ad.addAdEventListener(AdEventType.ERROR, () => settle(false));
      timeout = setTimeout(() => settle(false), INTERSTITIAL_LOAD_TIMEOUT_MS);

      try {
        ad.load();
      } catch {
        settle(false);
      }
    });
  } catch {
    interstitialLoading = false;
    interstitialAd = null;
    return false;
  }
}

export async function showInterstitialAd(onClosed: () => void, onFailed?: () => void): Promise<boolean> {
  if (!interstitialAd || interstitialShowing) return false;
  const ad = interstitialAd;
  interstitialShowing = true;
  let closedSub: Unsubscribe | undefined;
  let errorSub: Unsubscribe | undefined;
  let finished = false;
  const finish = (shown: boolean) => {
    if (finished) return;
    finished = true;
    closedSub?.();
    errorSub?.();
    interstitialShowing = false;
    if (interstitialAd === ad) interstitialAd = null;
    if (shown) onClosed();
    else onFailed?.();
  };
  try {
    const { AdEventType } = await loadGoogleMobileAdsModule();
    closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    errorSub = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    await ad.show();
    return true;
  } catch {
    finish(false);
    return false;
  }
}
