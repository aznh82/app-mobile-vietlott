import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { GAME_CONFIGS } from '../types/game';
import type { GameId } from '../types/game';
import type { GameStackParamList } from '../types/navigation';
import {
  getDrawsByPeriod,
  getLongestAbsent,
} from '../database/database';
import { calculateStats, generateSuggestions } from '../utils/statistics';
import type { NumberStats, SuggestedSet } from '../utils/statistics';
import { usePremium } from '../context/PremiumContext';
import { showInterstitialAd } from '../services/interstitialAd';
import AdBanner from '../components/AdBanner';
import PremiumPaywall from '../components/PremiumPaywall';
import PeriodFilter from '../components/PeriodFilter';
import FrequencyChart from '../components/FrequencyChart';
import AbsentNumbers from '../components/AbsentNumbers';
import SuggestedSets from '../components/SuggestedSets';

type Props = NativeStackScreenProps<GameStackParamList, 'GameStats'>;

export default function GameStatsScreen() {
  const route = useRoute<Props['route']>();
  const { gameId } = route.params;
  const config = GAME_CONFIGS[gameId];
  const { isPremium, maxSuggestedSets } = usePremium();

  const is3D = gameId === 'max3d' || gameId === 'max3d_pro';
  const isLottery = !is3D;

  const [showPaywall, setShowPaywall] = useState(!isPremium);
  const [period, setPeriod] = useState('30d');
  const [statsData, setStatsData] = useState<NumberStats[]>([]);
  const [statsTotalDraws, setStatsTotalDraws] = useState(0);
  const [absentData, setAbsentData] = useState<NumberStats[]>([]);
  const [suggestedSets, setSuggestedSets] = useState<SuggestedSet[]>([]);

  const loadStatsIdRef = useRef(0);

  const shownInterstitial = useRef(false);

  useEffect(() => {
    if (!isPremium) {
      setShowPaywall(true);
      // Show interstitial on first stats view for free users
      if (!shownInterstitial.current) {
        shownInterstitial.current = true;
        try { showInterstitialAd(); } catch { /* ads optional */ }
      }
      return;
    }
    setShowPaywall(false);
    loadStats(period);
    loadAbsent();
    loadSuggestions();
  }, [isPremium, gameId]);

  const loadStats = async (p: string) => {
    const id = ++loadStatsIdRef.current;
    try {
      const draws = await getDrawsByPeriod(gameId, p);
      if (id !== loadStatsIdRef.current) return;
      const stats = calculateStats(draws, gameId);
      setStatsData(stats);
      setStatsTotalDraws(draws.length);
    } catch (e) {
      console.warn(`loadStats(${gameId}) failed:`, e);
    }
  };

  const loadAbsent = async () => {
    try {
      const allAbsent = await getLongestAbsent(gameId, config.maxNumber);
      const absentStats: NumberStats[] = allAbsent.map((item) => ({
        label: item.number,
        freq: 0,
        absent: item.absent_draws,
      }));
      setAbsentData(absentStats);
    } catch (e) {
      console.warn(`loadAbsent(${gameId}) failed:`, e);
    }
  };

  const loadSuggestions = async () => {
    if (!isLottery) return;
    try {
      const draws = await getDrawsByPeriod(gameId, '30d');
      const absent = await getLongestAbsent(gameId, 10);
      const sets = generateSuggestions(draws, absent, {
        count: maxSuggestedSets,
        advanced: isPremium,
        gameId,
      });
      setSuggestedSets(sets);
    } catch (e) {
      console.warn(`loadSuggestions(${gameId}) failed:`, e);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    loadStats(newPeriod);
  };

  const handleRegenerate = () => {
    loadSuggestions();
  };

  const openPaywall = () => setShowPaywall(true);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <PremiumPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Tính năng Premium</Text>
          <Text style={styles.lockedDesc}>
            Nâng cấp lên Premium để xem thống kê chi tiết cho {config.name}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{config.name} — Thống kê</Text>
      </View>

      <PeriodFilter current={period} onChange={handlePeriodChange} />

      <FrequencyChart data={statsData} totalDraws={statsTotalDraws} />

      <AbsentNumbers data={absentData} />

      {isLottery && (
        <SuggestedSets
          sets={suggestedSets}
          totalDraws={statsTotalDraws}
          onRegenerate={handleRegenerate}
          onUpgrade={openPaywall}
        />
      )}

      {!isPremium && <AdBanner placement="bottom" />}
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
  screenHeader: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.3,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
