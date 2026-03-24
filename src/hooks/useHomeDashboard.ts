import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { GameId } from '../types/game';
import { ALL_GAME_IDS } from '../types/game';
import {
  initDB,
  getLatestDrawFull,
  cleanupOldData,
} from '../database/database';
import type { DrawRow } from '../database/database';
import { fetchAllGames } from '../services/scraper';
import { preloadInterstitial, cleanupInterstitial } from '../services/interstitialAd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MobileAds: any;
try {
  MobileAds = require('react-native-google-mobile-ads').MobileAds;
} catch {
  // AdMob not available
}

export interface GameCardData {
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

function createEmptyCardMap(): Record<GameId, GameCardData> {
  return {
    mega645: EMPTY_CARD_DATA,
    power655: EMPTY_CARD_DATA,
    lotto535: EMPTY_CARD_DATA,
    max3d: EMPTY_CARD_DATA,
    max3d_pro: EMPTY_CARD_DATA,
  };
}

export default function useHomeDashboard() {
  const [adReady, setAdReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardData, setCardData] = useState<Record<GameId, GameCardData>>(createEmptyCardMap);

  const handleFetchRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // === Init: AdMob + DB + load cards ===
  useEffect(() => {
    (async () => {
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

  // === Load latest draw for each game ===
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

  // === Fetch all games (first launch or manual) ===
  const doFetchAllGames = async () => {
    try {
      Alert.alert('Đang tải', 'Đang tải dữ liệu cho tất cả trò chơi...');
      await fetchAllGames();
      await loadAllCards();
    } catch (e: unknown) {
      console.warn('fetchAllGames failed:', e);
      Alert.alert('Lỗi', (e as Error)?.message || 'Không thể tải dữ liệu');
    }
  };

  // === Refresh handler ===
  const handleFetch = async () => {
    try {
      await fetchAllGames();
      await loadAllCards();
    } catch (e: unknown) {
      console.warn('handleFetch failed:', e);
      Alert.alert('Lỗi', (e as Error)?.message || 'Không thể tải dữ liệu');
    }
  };

  handleFetchRef.current = handleFetch;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleFetchRef.current?.();
    setRefreshing(false);
  }, []);

  return {
    cardData,
    adReady,
    refreshing,
    onRefresh,
  };
}
