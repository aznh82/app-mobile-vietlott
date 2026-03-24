// eslint-disable-next-line @typescript-eslint/no-explicit-any
let InterstitialAd: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AdEventType: any;

try {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
} catch {
  // AdMob not available
}

// TODO: Tạo interstitial ad unit ID riêng trên AdMob Console
// Hiện tại tạm TẮT interstitial trong production cho đến khi có ID riêng
// Banner ID KHÔNG dùng được cho interstitial → sẽ crash
const AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712'  // Google test interstitial
  : '';  // Tạm để trống — sẽ không load

let interstitial: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let isLoaded = false;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RETRIES = 5;

function createAndLoad() {
  if (!InterstitialAd || !AD_UNIT_ID) return; // AdMob not available or no ad unit configured
  interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
    keywords: ['lottery', 'statistics', 'vietlott'],
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
    retryCount = 0; // Reset on success
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    retryCount = 0;
    createAndLoad();
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    isLoaded = false;
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      // Exponential backoff: 30s, 60s, 90s, 120s, 150s
      retryTimer = setTimeout(createAndLoad, 30000 * retryCount);
    }
  });

  interstitial.load();
}

export function preloadInterstitial() {
  if (!interstitial) {
    createAndLoad();
  }
}

export function cleanupInterstitial() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  // Remove all listeners BEFORE nulling reference to prevent stale CLOSED listener
  // from firing createAndLoad() after cleanup
  if (interstitial) {
    try {
      interstitial.removeAllListeners();
    } catch {
      // Listener removal may fail if ad object is already disposed
    }
    interstitial = null;
  }
  isLoaded = false;
  retryCount = 0;
}

export async function showInterstitialAd(): Promise<boolean> {
  if (isLoaded && interstitial) {
    try {
      await interstitial.show();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
