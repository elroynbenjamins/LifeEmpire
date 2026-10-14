describe('ad consent recovery', () => {
  let consent: { gatherConsent: jest.Mock; getConsentInfo: jest.Mock };
  let initialize: jest.Mock;
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    consent = { gatherConsent: jest.fn(), getConsentInfo: jest.fn() };
    initialize = jest.fn(async () => undefined);
    jest.doMock('../nativeAdsModule', () => ({
      loadGoogleMobileAdsModule: async () => ({ AdsConsent: consent, default: () => ({ initialize }) }),
    }));
  });
  afterEach(() => { jest.useRealTimers(); jest.dontMock('../nativeAdsModule'); });

  test('a temporary failure can retry instead of disabling ads for the whole session', async () => {
    consent.gatherConsent.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ canRequestAds: true });
    consent.getConsentInfo.mockResolvedValue({ canRequestAds: false });
    const manager = require('../adPrivacyManager');
    await expect(manager.canRequestAds()).resolves.toBe(false);
    await expect(manager.canRequestAds()).resolves.toBe(false);
    expect(consent.gatherConsent).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(30001);
    await expect(manager.canRequestAds()).resolves.toBe(true);
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  test('stored consent is used only when it explicitly permits ad requests', async () => {
    consent.gatherConsent.mockRejectedValue(new Error('form unavailable'));
    consent.getConsentInfo.mockResolvedValue({ canRequestAds: true });
    await expect(require('../adPrivacyManager').canRequestAds()).resolves.toBe(true);
    expect(initialize).toHaveBeenCalledTimes(1);
  });
});
