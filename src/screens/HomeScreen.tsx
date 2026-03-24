import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
let MobileAds: any;
try {
  MobileAds = require('react-native-google-mobile-ads').MobileAds;
} catch {
  // AdMob not available — app works without ads
}
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { GAME_CONFIGS, ALL_GAME_IDS } from '../types/game';
import type { GameId } from '../types/game';
import type { RootTabParamList } from '../types/navigation';
import {
  initDB,
  getLatestDrawFull,
  cleanupOldData,
} from '../database/database';
import type { DrawRow } from '../database/database';
import { fetchAllGames } from '../services/scraper';
import { usePremium } from '../context/PremiumContext';
import { preloadInterstitial, cleanupInterstitial } from '../services/interstitialAd';
import AdBanner from '../components/AdBanner';
import PremiumBadge from '../components/PremiumBadge';
import PremiumPaywall from '../components/PremiumPaywall';
import UpgradePromptBanner from '../components/UpgradePromptBanner';
import GameResultCard from '../components/GameResultCard';

type HomeNavProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

const GAME_TAB_MAP: Record<GameId, keyof RootTabParamList> = {
  mega645: 'Game645',
  power655: 'Game655',
  lotto535: 'Game535',
  max3d: 'GameMax3D',
  max3d_pro: 'GameMax3D',
};

interface GameCardData {
  drawNumber: string | null;
  drawDate: string | null;
  numbers: number[];
  specialNumber?: number;
}

const EMPTY_CARD_DATA: GameCardData = {
  drawNumber: null,
  drawDate: null,
  numbers: [],
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { isPremium } = usePremium();

  const [adReady, setAdReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [cardData, setCardData] = useState<Record<GameId, GameCardData>>({
    mega645: EMPTY_CARD_DATA,
    power655: EMPTY_CARD_DATA,
    lotto535: EMPTY_CARD_DATA,
    max3d: EMPTY_CARD_DATA,
    max3d_pro: EMPTY_CARD_DATA,
  });

  const handleFetchRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    (async () => {
      // Initialize Google Mobile Ads (non-blocking)
      try {
        if (MobileAds) {
          await MobileAds().initialize();
          setAdReady(true);
          preloadInterstitial();
        }
      } catch (e) {
        console.warn('AdMob init failed (ads disabled):', e);
      }

      await initDB();
      await cleanupOldData('mega645');
      await loadAllCards();
    })();

    return () => { cleanupInterstitial(); };
  }, []);

  const loadAllCards = async () => {
    const updates: Partial<Record<GameId, GameCardData>> = {};
    await Promise.all(
      ALL_GAME_IDS.map(async (gameId) => {
        try {
          const row: DrawRow | null = await getLatestDrawFull(gameId);
          if (row) {
            updates[gameId] = {
              drawNumber: row.draw_number,
              drawDate: row.draw_date,
              numbers: row.numbers,
              specialNumber: row.special_number,
            };
          }
        } catch (e) {
          console.warn(`loadAllCards(${gameId}) failed:`, e);
        }
      })
    );

    const hasAnyData = Object.values(updates).some((d) => d.drawNumber !== null);

    setCardData((prev) => {
      const next = { ...prev };
      for (const gameId of ALL_GAME_IDS) {
        if (updates[gameId]) {
          next[gameId] = updates[gameId] as GameCardData;
        }
      }
      return next;
    });

    if (!hasAnyData) {
      await doFetchAllGames();
    }
  };

  const doFetchAllGames = async () => {
    try {
      Alert.alert('Đang tải', 'Đang tải dữ liệu cho tất cả trò chơi...');
      await fetchAllGames();
      await loadAllCards();
    } catch (e: any) {
      console.warn('fetchAllGames failed:', e);
      Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu');
    }
  };

  const handleFetch = async () => {
    try {
      await fetchAllGames();
      await loadAllCards();
    } catch (e: any) {
      console.warn('handleFetch failed:', e);
      Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu');
    }
  };

  handleFetchRef.current = handleFetch;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleFetchRef.current?.();
    setRefreshing(false);
  }, []);

  const openPaywall = () => setShowPaywall(true);

  const handleCardPress = (gameId: GameId) => {
    const tabName = GAME_TAB_MAP[gameId];
    navigation.navigate(tabName as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>VIETLOTT</Text>
            <Text style={styles.headerSubtitle}>Tổng hợp kết quả xổ số</Text>
          </View>
          <PremiumBadge onPress={openPaywall} />
        </View>
      </View>

      <PremiumPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* Game cards for all 5 games */}
      {ALL_GAME_IDS.map((gameId) => {
        const config = GAME_CONFIGS[gameId];
        const data = cardData[gameId];
        return (
          <GameResultCard
            key={gameId}
            gameId={gameId}
            config={config}
            drawNumber={data.drawNumber}
            drawDate={data.drawDate}
            numbers={data.numbers}
            specialNumber={data.specialNumber}
            onPress={() => handleCardPress(gameId)}
          />
        );
      })}

      {/* Soft upgrade prompt */}
      <UpgradePromptBanner onUpgrade={openPaywall} />

      {/* Bottom banner ad */}
      {adReady && <AdBanner placement="bottom" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
