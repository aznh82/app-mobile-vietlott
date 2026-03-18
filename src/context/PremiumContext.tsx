import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - phải khớp với Google Play Console
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'vietlott_premium_monthly',   // $1.99/tháng
  PREMIUM_LIFETIME: 'vietlott_premium_lifetime',  // $4.99 mua 1 lần
};

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  purchaseMonthly: () => Promise<void>;
  purchaseLifetime: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  purchaseMonthly: async () => {},
  purchaseLifetime: async () => {},
  restorePurchases: async () => {},
});

export function usePremium() {
  return useContext(PremiumContext);
}

const PREMIUM_KEY = '@vietlott_premium';

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check cached premium status on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(PREMIUM_KEY);
        if (cached === 'true') {
          setIsPremium(true);
        }
        // Try to initialize IAP and verify purchases
        await initIAP();
      } catch (e) {
        console.warn('Premium check failed:', e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      endIAPConnection();
    };
  }, []);

  const initIAP = async () => {
    try {
      const RNIap = require('react-native-iap');
      await RNIap.initConnection();

      // Check existing purchases (restore)
      if (Platform.OS === 'android') {
        const purchases = await RNIap.getAvailablePurchases();
        const hasPremium = purchases.some(
          (p: any) =>
            p.productId === PRODUCTS.PREMIUM_MONTHLY ||
            p.productId === PRODUCTS.PREMIUM_LIFETIME
        );
        if (hasPremium) {
          setIsPremium(true);
          await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        }
      }
    } catch (e) {
      // IAP not available (emulator, dev mode, etc.)
      console.warn('IAP init failed:', e);
    }
  };

  const endIAPConnection = async () => {
    try {
      const RNIap = require('react-native-iap');
      await RNIap.endConnection();
    } catch {}
  };

  const purchaseMonthly = useCallback(async () => {
    try {
      const RNIap = require('react-native-iap');
      const subscriptions = await RNIap.getSubscriptions({
        skus: [PRODUCTS.PREMIUM_MONTHLY],
      });

      if (subscriptions.length === 0) {
        Alert.alert('Lỗi', 'Không tìm thấy gói Premium. Vui lòng thử lại sau.');
        return;
      }

      await RNIap.requestSubscription({
        sku: PRODUCTS.PREMIUM_MONTHLY,
      });

      setIsPremium(true);
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      Alert.alert('Thành công! 🎉', 'Bạn đã nâng cấp lên Premium!');
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Lỗi', e.message || 'Không thể mua. Vui lòng thử lại.');
      }
    }
  }, []);

  const purchaseLifetime = useCallback(async () => {
    try {
      const RNIap = require('react-native-iap');
      const products = await RNIap.getProducts({
        skus: [PRODUCTS.PREMIUM_LIFETIME],
      });

      if (products.length === 0) {
        Alert.alert('Lỗi', 'Không tìm thấy gói Premium. Vui lòng thử lại sau.');
        return;
      }

      await RNIap.requestPurchase({
        sku: PRODUCTS.PREMIUM_LIFETIME,
      });

      setIsPremium(true);
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      Alert.alert('Thành công! 🎉', 'Bạn đã nâng cấp lên Premium vĩnh viễn!');
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Lỗi', e.message || 'Không thể mua. Vui lòng thử lại.');
      }
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const RNIap = require('react-native-iap');
      const purchases = await RNIap.getAvailablePurchases();
      const hasPremium = purchases.some(
        (p: any) =>
          p.productId === PRODUCTS.PREMIUM_MONTHLY ||
          p.productId === PRODUCTS.PREMIUM_LIFETIME
      );

      if (hasPremium) {
        setIsPremium(true);
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        Alert.alert('Đã khôi phục', 'Gói Premium của bạn đã được khôi phục!');
      } else {
        Alert.alert('Không tìm thấy', 'Không có giao dịch Premium nào trước đó.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể khôi phục. Vui lòng thử lại.');
    }
  }, []);

  return (
    <PremiumContext.Provider
      value={{ isPremium, loading, purchaseMonthly, purchaseLifetime, restorePurchases }}
    >
      {children}
    </PremiumContext.Provider>
  );
}
