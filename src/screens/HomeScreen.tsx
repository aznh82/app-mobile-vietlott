import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
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
import { colors } from '../theme';
import {
  initDB,
  saveDraws,
  getLatestDraw,
  getDrawsByPeriod,
  getTotalDraws,
  getLatestDrawFull,
  getLongestAbsent,
  cleanupOldData,
} from '../database/database';
import { fetchNew, fetchAllFrom, fetchJackpotInfo } from '../services/scraper';
import { calculateStats, generateSuggestions, NumberStats, SuggestedSet } from '../utils/statistics';
import { usePremium } from '../context/PremiumContext';
import { preloadInterstitial, showInterstitialAd, cleanupInterstitial } from '../services/interstitialAd';
import Header from '../components/Header';
import LatestResult from '../components/LatestResult';
import PeriodFilter from '../components/PeriodFilter';
import FrequencyChart from '../components/FrequencyChart';
import AbsentNumbers from '../components/AbsentNumbers';
import SuggestedSets from '../components/SuggestedSets';
import AdBanner from '../components/AdBanner';
import PremiumBadge from '../components/PremiumBadge';
import PremiumPaywall from '../components/PremiumPaywall';
import UpgradePromptBanner from '../components/UpgradePromptBanner';

// Earliest draw number to fetch — Vietlott 6/45 draw #1328 (first reliable data point)
const START_DRAW = '01328';

export default function HomeScreen() {
  const {
    isPremium,
    maxSuggestedSets,
    shouldShowInterstitial,
    incrementFetchCount,
    resetInterstitialFlag,
  } = usePremium();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [totalDraws, setTotalDraws] = useState(0);
  const [latestDrawNum, setLatestDrawNum] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  // Latest result
  const [latestResult, setLatestResult] = useState<{
    draw_number: string;
    draw_date: string;
    numbers: string[];
  } | null>(null);
  const [jackpot, setJackpot] = useState<string | null>(null);
  const [jackpotWinners, setJackpotWinners] = useState<string | null>(null);

  // Stats
  const [statsData, setStatsData] = useState<NumberStats[]>([]);
  const [statsTotalDraws, setStatsTotalDraws] = useState(0);
  const [suggestedSets, setSuggestedSets] = useState<SuggestedSet[]>([]);
  // Absent data - independent from period filter (always 156 draws / 1 year)
  const [absentData, setAbsentData] = useState<NumberStats[]>([]);
  // Guard against race condition when switching periods rapidly
  const loadStatsIdRef = useRef(0);
  // Ref to avoid stale closure in onRefresh
  const handleFetchRef = useRef<(() => Promise<void>) | undefined>(undefined);
  // Premium paywall
  const [showPaywall, setShowPaywall] = useState(false);

  // Initialize DB and load data
  useEffect(() => {
    (async () => {
      // Initialize Google Mobile Ads (non-blocking — ads are optional)
      try {
        if (MobileAds) {
          await MobileAds().initialize();
          setAdReady(true); // Chỉ render AdBanner SAU KHI SDK sẵn sàng
          preloadInterstitial();
        }
      } catch (e) {
        console.warn('AdMob init failed (ads disabled):', e);
      }

      await initDB();
      await cleanupOldData('mega645');
      await refreshCounts();
      await loadLatestResult();
      await loadAbsent();
      await loadStats('30d');
      await loadSuggestions();
    })();

    return () => { cleanupInterstitial(); };
  }, []);

  // Re-generate suggestions when premium state changes (fixes stale closure)
  useEffect(() => {
    if (!loading) {
      loadSuggestions();
    }
  }, [isPremium, maxSuggestedSets]);

  const refreshCounts = async () => {
    const total = await getTotalDraws('mega645');
    const latest = await getLatestDraw('mega645');
    setTotalDraws(total);
    setLatestDrawNum(latest);
  };

  const loadLatestResult = async () => {
    const data = await getLatestDrawFull('mega645');
    if (data) {
      const nums = data.numbers.sort((a, b) => a - b);
      setLatestResult({
        draw_number: data.draw_number,
        draw_date: data.draw_date,
        numbers: nums.map((n) => String(n).padStart(2, '0')),
      });
    }
    try {
      const info = await fetchJackpotInfo();
      setJackpot(info.jackpot);
      setJackpotWinners(info.jackpot_winners);
    } catch {
      // ignore
    }
  };

  const loadAbsent = async () => {
    const allAbsent = await getLongestAbsent('mega645', 45);
    const absentStats: NumberStats[] = allAbsent.map((item) => ({
      label: item.number,
      freq: 0,
      absent: item.absent_draws,
    }));
    setAbsentData(absentStats);
  };

  const loadSuggestions = async () => {
    const draws = await getDrawsByPeriod('mega645', '30d');
    const absent = await getLongestAbsent('mega645', 10);
    const sets = generateSuggestions(draws, absent, {
      count: maxSuggestedSets,
      advanced: isPremium,
    });
    setSuggestedSets(sets);
  };

  const loadStats = async (p: string) => {
    const id = ++loadStatsIdRef.current;
    const draws = await getDrawsByPeriod('mega645', p);
    if (id !== loadStatsIdRef.current) return;
    const stats = calculateStats(draws);
    setStatsData(stats);
    setStatsTotalDraws(draws.length);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    loadStats(newPeriod);
  };

  const handleFetch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const latest = await getLatestDraw('mega645');
      let results: [string, string, number[]][];
      if (latest) {
        results = await fetchNew(latest);
      } else {
        results = await fetchAllFrom(START_DRAW);
      }

      const inserted = results.length > 0 ? await saveDraws('mega645', results) : 0;
      await refreshCounts();
      await loadLatestResult();
      await loadAbsent();
      await loadStats(period);
      await loadSuggestions();

      Alert.alert(
        'Hoàn thành',
        `Đã tải ${inserted} kỳ mới`,
        [{
          text: 'OK',
          onPress: async () => {
            // Interstitial ad mỗi 3 lần fetch (free users)
            const shouldShow = incrementFetchCount();
            if (shouldShow) {
              await showInterstitialAd();
              resetInterstitialFlag();
            }
          },
        }]
      );
    } catch (e: any) {
      const msg = e.message || 'Không thể tải dữ liệu';
      const isParseError = msg.includes('Could not extract') || msg.includes('API error');
      Alert.alert(
        isParseError ? 'Lỗi cấu trúc dữ liệu' : 'Lỗi kết nối',
        isParseError
          ? 'Website Vietlott có thể đã thay đổi cấu trúc. Vui lòng cập nhật app.'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  // Keep ref in sync so onRefresh always calls latest handleFetch
  handleFetchRef.current = handleFetch;

  const handleRegenerate = () => {
    loadSuggestions();
  };

  const openPaywall = () => setShowPaywall(true);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleFetchRef.current?.();
    setRefreshing(false);
  }, []);

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
      <Header
        totalDraws={totalDraws}
        latestDraw={latestDrawNum}
        loading={loading}
        onFetch={handleFetch}
      >
        <PremiumBadge onPress={openPaywall} />
      </Header>

      <PremiumPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      <LatestResult
        drawNumber={latestResult?.draw_number ?? null}
        drawDate={latestResult?.draw_date ?? null}
        numbers={latestResult?.numbers ?? []}
        jackpot={jackpot}
        jackpotWinners={jackpotWinners}
      />

      {/* Inline ad: sau kết quả mở thưởng */}
      {adReady && <AdBanner placement="inline" />}

      <PeriodFilter current={period} onChange={handlePeriodChange} />

      <FrequencyChart data={statsData} totalDraws={statsTotalDraws} />

      {/* Inline ad: sau biểu đồ tần suất */}
      {adReady && <AdBanner placement="inline" />}

      <AbsentNumbers data={absentData} />

      <SuggestedSets
        sets={suggestedSets}
        totalDraws={statsTotalDraws}
        onRegenerate={handleRegenerate}
        onUpgrade={openPaywall}
      />

      {/* Soft upgrade prompt (mỗi 5 lần mở app) */}
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
});
