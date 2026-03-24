import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Minimal shape of a react-native-iap purchase object */
interface IAPPurchase {
  productId: string;
  purchaseToken?: string;
}

/** Minimal shape of a react-native-iap purchase error */
interface IAPError {
  code?: string;
  message?: string;
}

/** Minimal shape of an event-listener subscription returned by react-native-iap */
interface IAPSubscription {
  remove(): void;
}

// Product IDs - phải khớp với Google Play Console
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'vietlott_premium_monthly',
  PREMIUM_LIFETIME: 'vietlott_premium_lifetime',
};

const PREMIUM_PRODUCT_IDS = [PRODUCTS.PREMIUM_MONTHLY, PRODUCTS.PREMIUM_LIFETIME];

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  // Feature gating
  maxSuggestedSets: number;
  // Ad control
  shouldShowInterstitial: boolean;
  incrementFetchCount: () => boolean;
  resetInterstitialFlag: () => void;
  // Upgrade prompt
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
  // Purchase
  purchaseMonthly: () => Promise<void>;
  purchaseLifetime: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  maxSuggestedSets: 3,
  shouldShowInterstitial: false,
  incrementFetchCount: () => false,
  resetInterstitialFlag: () => {},
  showUpgradePrompt: false,
  dismissUpgradePrompt: () => {},
  purchaseMonthly: async () => {},
  purchaseLifetime: async () => {},
  restorePurchases: async () => {},
});

export function usePremium() {
  return useContext(PremiumContext);
}

const PREMIUM_KEY = '@vietlott_premium';
const APP_OPENS_KEY = '@vietlott_app_opens';

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldShowInterstitial, setShouldShowInterstitial] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const fetchCountRef = useRef(0);
  const iapAvailableRef = useRef(false);
  const purchaseListenerRef = useRef<IAPSubscription | null>(null);
  const errorListenerRef = useRef<IAPSubscription | null>(null);

  // Derived
  const maxSuggestedSets = isPremium ? 5 : 3;

  useEffect(() => {
    (async () => {
      try {
        // Check cached premium (optimistic UI — show premium immediately)
        const cached = await AsyncStorage.getItem(PREMIUM_KEY);
        if (cached === 'true') {
          setIsPremium(true);
        }

        // Always verify with IAP (overrides cache if no real purchase)
        const verified = await initIAP();
        if (!verified && cached === 'true') {
          // Cache said premium but IAP says no → revoke
          setIsPremium(false);
          await AsyncStorage.removeItem(PREMIUM_KEY);
        }

        // Track app opens for upgrade prompt (free users only)
        if (!verified) {
          const opensStr = await AsyncStorage.getItem(APP_OPENS_KEY);
          const opens = (parseInt(opensStr || '0', 10) || 0) + 1;
          await AsyncStorage.setItem(APP_OPENS_KEY, String(opens));
          if (opens % 5 === 0) {
            setShowUpgradePrompt(true);
          }
        }
      } catch (e) {
        console.warn('Premium check failed:', e);
      } finally {
        setLoading(false);
      }
    })();

    return () => { endIAPConnection(); };
  }, []);

  /** Grant premium after verified purchase */
  const grantPremium = useCallback(async () => {
    setIsPremium(true);
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
  }, []);

  /** Returns true if user has verified premium purchase */
  const initIAP = async (): Promise<boolean> => {
    try {
      const RNIap = require('react-native-iap');
      await RNIap.initConnection();
      iapAvailableRef.current = true;

      // Setup purchase listener — grants premium only after receipt is confirmed
      purchaseListenerRef.current = RNIap.purchaseUpdatedListener(
        async (purchase: IAPPurchase) => {
          const isPremiumProduct = PREMIUM_PRODUCT_IDS.includes(purchase.productId);
          if (isPremiumProduct) {
            // Acknowledge the purchase (required by Google Play)
            try {
              if (purchase.purchaseToken) {
                await RNIap.finishTransaction({ purchase, isConsumable: false });
              }
            } catch (ackErr) {
              console.warn('Failed to acknowledge purchase:', ackErr);
            }
            await grantPremium();
            Alert.alert('Thành công!', 'Bạn đã nâng cấp lên Premium!');
          }
        }
      );

      // Setup error listener
      errorListenerRef.current = RNIap.purchaseErrorListener(
        (error: IAPError) => {
          if (error.code !== 'E_USER_CANCELLED') {
            console.warn('Purchase error:', error);
          }
        }
      );

      // Check existing purchases (restore on startup)
      if (Platform.OS === 'android') {
        const purchases = await RNIap.getAvailablePurchases();
        const hasPremium = purchases.some(
          (p: IAPPurchase) => PREMIUM_PRODUCT_IDS.includes(p.productId)
        );
        if (hasPremium) {
          await grantPremium();
          return true;
        }
      }
      return false;
    } catch (e) {
      iapAvailableRef.current = false;
      console.warn('IAP init failed:', e);
      return false;
    }
  };

  const endIAPConnection = async () => {
    try {
      // Remove listeners before ending connection
      if (purchaseListenerRef.current) {
        purchaseListenerRef.current.remove();
        purchaseListenerRef.current = null;
      }
      if (errorListenerRef.current) {
        errorListenerRef.current.remove();
        errorListenerRef.current = null;
      }
      const RNIap = require('react-native-iap');
      await RNIap.endConnection();
    } catch {}
  };

  const incrementFetchCount = useCallback((): boolean => {
    if (isPremium) return false;
    fetchCountRef.current += 1;
    // Hiển thị interstitial mỗi 3 lần fetch
    const shouldShow = fetchCountRef.current % 3 === 0;
    if (shouldShow) {
      setShouldShowInterstitial(true);
    }
    return shouldShow;
  }, [isPremium]);

  const resetInterstitialFlag = useCallback(() => {
    setShouldShowInterstitial(false);
  }, []);

  const dismissUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
  }, []);

  const purchaseMonthly = useCallback(async () => {
    if (!iapAvailableRef.current) {
      Alert.alert('Lỗi', 'Tính năng mua hàng không khả dụng trên thiết bị này.');
      return;
    }
    try {
      const RNIap = require('react-native-iap');
      const subscriptions = await RNIap.getSubscriptions({
        skus: [PRODUCTS.PREMIUM_MONTHLY],
      });
      if (subscriptions.length === 0) {
        Alert.alert('Lỗi', 'Không tìm thấy gói Premium. Vui lòng thử lại sau.');
        return;
      }
      // Only initiate purchase flow — premium is granted by purchaseUpdatedListener
      await RNIap.requestSubscription({ sku: PRODUCTS.PREMIUM_MONTHLY });
    } catch (e: unknown) {
      const err = e as IAPError;
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Lỗi', err.message || 'Không thể mua. Vui lòng thử lại.');
      }
    }
  }, []);

  const purchaseLifetime = useCallback(async () => {
    if (!iapAvailableRef.current) {
      Alert.alert('Lỗi', 'Tính năng mua hàng không khả dụng trên thiết bị này.');
      return;
    }
    try {
      const RNIap = require('react-native-iap');
      const products = await RNIap.getProducts({ skus: [PRODUCTS.PREMIUM_LIFETIME] });
      if (products.length === 0) {
        Alert.alert('Lỗi', 'Không tìm thấy gói Premium. Vui lòng thử lại sau.');
        return;
      }
      // Only initiate purchase flow — premium is granted by purchaseUpdatedListener
      await RNIap.requestPurchase({ sku: PRODUCTS.PREMIUM_LIFETIME });
    } catch (e: unknown) {
      const err = e as IAPError;
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Lỗi', err.message || 'Không thể mua. Vui lòng thử lại.');
      }
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!iapAvailableRef.current) {
      Alert.alert('Lỗi', 'Tính năng mua hàng không khả dụng trên thiết bị này.');
      return;
    }
    try {
      const RNIap = require('react-native-iap');
      const purchases = await RNIap.getAvailablePurchases();
      const hasPremium = purchases.some(
        (p: IAPPurchase) => PREMIUM_PRODUCT_IDS.includes(p.productId)
      );
      if (hasPremium) {
        await grantPremium();
        Alert.alert('Đã khôi phục', 'Gói Premium của bạn đã được khôi phục!');
      } else {
        Alert.alert('Không tìm thấy', 'Không có giao dịch Premium nào trước đó.');
      }
    } catch (e: unknown) {
      Alert.alert('Lỗi', (e as IAPError).message || 'Không thể khôi phục. Vui lòng thử lại.');
    }
  }, [grantPremium]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        loading,
        maxSuggestedSets,
        shouldShowInterstitial,
        incrementFetchCount,
        resetInterstitialFlag,
        showUpgradePrompt,
        dismissUpgradePrompt,
        purchaseMonthly,
        purchaseLifetime,
        restorePurchases,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}
