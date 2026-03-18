import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { colors } from '../theme';
import { usePremium } from '../context/PremiumContext';

const BANNER_AD_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-5240031366086683/5898684425';

interface AdBannerProps {
  placement?: 'bottom' | 'inline';
}

export default function AdBanner({ placement = 'bottom' }: AdBannerProps) {
  const { isPremium } = usePremium();

  if (isPremium) return null;

  const isInline = placement === 'inline';

  return (
    <View style={isInline ? styles.inlineContainer : styles.bottomContainer}>
      <BannerAd
        unitId={BANNER_AD_ID}
        size={isInline ? BannerAdSize.MEDIUM_RECTANGLE : BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          keywords: ['lottery', 'statistics', 'prediction', 'vietlott'],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderCard,
    paddingTop: 8,
  },
  inlineContainer: {
    alignItems: 'center',
    marginVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
