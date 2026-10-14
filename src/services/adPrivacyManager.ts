import { loadGoogleMobileAdsModule } from './nativeAdsModule';

let initialization: Promise<boolean> | null = null;
let adsAllowed = false;
let retryAfter = 0;

export function initializeAdConsent(): Promise<boolean> {
  if (initialization) return initialization;
  if (Date.now() < retryAfter) return Promise.resolve(false);

  initialization = (async () => {
    try {
      const adsModule = await loadGoogleMobileAdsModule();
      // A transient network/form failure may still leave valid stored consent.
      const consentInfo = await adsModule.AdsConsent.gatherConsent().catch(() => adsModule.AdsConsent.getConsentInfo());
      adsAllowed = consentInfo.canRequestAds;
      if (adsAllowed) await adsModule.default().initialize();
      return adsAllowed;
    } catch {
      adsAllowed = false;
      return false;
    }
  })().then(allowed => {
    if (!allowed) {
      retryAfter = Date.now() + 30000;
      initialization = null;
    }
    return allowed;
  });

  return initialization;
}

export async function canRequestAds(): Promise<boolean> {
  if (!initialization) await initializeAdConsent();
  else await initialization;
  return adsAllowed;
}

export async function showAdPrivacyOptions(): Promise<boolean> {
  try {
    const { AdsConsent } = await loadGoogleMobileAdsModule();
    const consentInfo = await AdsConsent.showPrivacyOptionsForm();
    adsAllowed = consentInfo.canRequestAds;
    initialization = null;
    retryAfter = 0;
    if (adsAllowed) {
      const adsModule = await loadGoogleMobileAdsModule();
      await adsModule.default().initialize();
    }
    return true;
  } catch {
    adsAllowed = false;
    initialization = null;
    retryAfter = Date.now() + 30000;
    return false;
  }
}
