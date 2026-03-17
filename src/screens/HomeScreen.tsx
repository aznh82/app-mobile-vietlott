import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
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
import Header from '../components/Header';
import LatestResult from '../components/LatestResult';
import PeriodFilter from '../components/PeriodFilter';
import FrequencyChart from '../components/FrequencyChart';
import AbsentNumbers from '../components/AbsentNumbers';
import SuggestedSets from '../components/SuggestedSets';

const START_DRAW = '01328';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Initialize DB and load data
  useEffect(() => {
    (async () => {
      await initDB();
      await cleanupOldData();
      await refreshCounts();
      await loadLatestResult();
      await loadAbsent();
      await loadStats('30d');
      await loadSuggestions();
    })();
  }, []);

  const refreshCounts = async () => {
    const total = await getTotalDraws();
    const latest = await getLatestDraw();
    setTotalDraws(total);
    setLatestDrawNum(latest);
  };

  const loadLatestResult = async () => {
    const data = await getLatestDrawFull();
    if (data) {
      setLatestResult(data);
    }
    // Fetch jackpot info
    try {
      const info = await fetchJackpotInfo();
      setJackpot(info.jackpot);
      setJackpotWinners(info.jackpot_winners);
    } catch {
      // ignore
    }
  };

  const loadAbsent = async () => {
    // Luôn lấy từ 156 kỳ gần nhất (~1 năm), không phụ thuộc period
    const draws = await getDrawsByPeriod('6m');
    const allAbsent = await getLongestAbsent(45);
    // Build NumberStats from absent data for AbsentNumbers component
    const absentStats: NumberStats[] = allAbsent.map((item) => ({
      label: item.number,
      freq: 0,
      absent: item.absent_draws,
    }));
    setAbsentData(absentStats);
    return await getLongestAbsent(10);
  };

  const loadSuggestions = async () => {
    const draws = await getDrawsByPeriod('30d');
    const absent = await getLongestAbsent(10);
    const sets = generateSuggestions(draws, absent);
    setSuggestedSets(sets);
  };

  const loadStats = async (p: string) => {
    const draws = await getDrawsByPeriod(p);
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
      const latest = await getLatestDraw();
      let results: [string, string, number[]][];
      if (latest) {
        results = await fetchNew(latest);
      } else {
        results = await fetchAllFrom(START_DRAW);
      }

      const inserted = results.length > 0 ? await saveDraws(results) : 0;
      await refreshCounts();
      await loadLatestResult();
      await loadAbsent();
      await loadStats(period);
      await loadSuggestions();

      Alert.alert(
        'Hoàn thành',
        `Đã tải ${inserted} kỳ mới`,
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    loadSuggestions();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleFetch();
    setRefreshing(false);
  }, [period]);

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
      />

      <LatestResult
        drawNumber={latestResult?.draw_number ?? null}
        drawDate={latestResult?.draw_date ?? null}
        numbers={latestResult?.numbers ?? []}
        jackpot={jackpot}
        jackpotWinners={jackpotWinners}
      />

      <PeriodFilter current={period} onChange={handlePeriodChange} />

      <FrequencyChart data={statsData} totalDraws={statsTotalDraws} />

      <AbsentNumbers data={absentData} />

      <SuggestedSets
        sets={suggestedSets}
        totalDraws={statsTotalDraws}
        onRegenerate={handleRegenerate}
      />
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
