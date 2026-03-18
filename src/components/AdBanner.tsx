import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { colors } from '../theme';
import { usePremium } from '../context/PremiumContext';

// Test ad IDs (sử dụng khi testing)
// Production: thay bằng ad unit IDs từ Google AdMob
const BANNER_AD_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy';

export default function AdBanner() {
  const { isPremium } = usePremium();

  // Premium users: không hiển thị ads
  if (isPremium) return null;

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={BANNER_AD_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          keywords: ['lottery', 'statistics', 'prediction', 'vietlott'],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderCard,
    paddingTop: 8,
  },
});
