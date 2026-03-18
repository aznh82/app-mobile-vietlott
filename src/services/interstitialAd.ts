import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// TODO: Tạo interstitial ad unit trên AdMob Console, tạm dùng banner ID
const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-5240031366086683/5898684425';

let interstitial: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let isLoaded = false;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RETRIES = 5;

function createAndLoad() {
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
  interstitial = null;
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
