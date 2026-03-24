import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { GAME_CONFIGS } from '../types/game';
import type { GameId } from '../types/game';
import type { GameStackParamList } from '../types/navigation';
import {
  getLatestDrawFull,
  getLatestDraw,
  saveDraws,
  getDrawsByPeriod,
} from '../database/database';
import type { DrawRow } from '../database/database';
import { fetchNew, fetchAllFrom } from '../services/scraper';
import { usePremium } from '../context/PremiumContext';
import LatestResult from '../components/LatestResult';
import Max3DResult from '../components/Max3DResult';
import AdBanner from '../components/AdBanner';

type Props = NativeStackScreenProps<GameStackParamList, 'GameDetail'>;
type GameDetailNav = NativeStackNavigationProp<GameStackParamList, 'GameDetail'>;

function formatDate(drawDate: string): string {
  if (drawDate.includes('-')) {
    const [y, m, d] = drawDate.split('-');
    return `${d}/${m}/${y}`;
  }
  return drawDate;
}

interface DrawHistoryRowProps {
  row: DrawRow;
  is3D: boolean;
}

function DrawHistoryRow({ row, is3D }: DrawHistoryRowProps) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyMeta}>
        <Text style={styles.historyNum}>#{row.draw_number}</Text>
        <Text style={styles.historyDate}>{formatDate(row.draw_date)}</Text>
      </View>
      <View style={styles.historyBalls}>
        {row.numbers.map((n, i) => (
          <View key={i} style={[styles.historyBall, is3D && styles.historyBall3d]}>
            <Text style={styles.historyBallText}>
              {is3D ? String(n).padStart(3, '0') : String(n).padStart(2, '0')}
            </Text>
          </View>
        ))}
        {row.special_number !== undefined && (
          <View style={[styles.historyBall, styles.historyBallSpecial]}>
            <Text style={styles.historyBallText}>
              {String(row.special_number).padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function GameDetailScreen() {
  const navigation = useNavigation<GameDetailNav>();
  const route = useRoute<Props['route']>();
  const { gameId } = route.params;
  const config = GAME_CONFIGS[gameId];
  const { isPremium } = usePremium();

  const is3D = gameId === 'max3d' || gameId === 'max3d_pro';
  const [activeVariant, setActiveVariant] = useState<GameId>(gameId);

  const [latestDraw, setLatestDraw] = useState<DrawRow | null>(null);
  const [history, setHistory] = useState<DrawRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adReady] = useState(true);

  const activeConfig = GAME_CONFIGS[activeVariant];

  useEffect(() => {
    loadData();
  }, [activeVariant]);

  const loadData = async () => {
    try {
      const latest = await getLatestDrawFull(activeVariant);
      setLatestDraw(latest);
      const draws = await getDrawsByPeriod(activeVariant, '30d');
      setHistory(draws);
    } catch (e) {
      console.warn(`GameDetailScreen loadData(${activeVariant}) failed:`, e);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const latest = await getLatestDraw(activeVariant);
      let results: [string, string, number[], number?][];
      if (latest) {
        results = await fetchNew(activeVariant, latest);
      } else {
        results = await fetchAllFrom(activeVariant);
      }
      if (results.length > 0) {
        await saveDraws(activeVariant, results);
      }
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu');
    } finally {
      setRefreshing(false);
    }
  }, [activeVariant]);

  const handleFetch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const latest = await getLatestDraw(activeVariant);
      let results: [string, string, number[], number?][];
      if (latest) {
        results = await fetchNew(activeVariant, latest);
      } else {
        results = await fetchAllFrom(activeVariant);
      }
      const inserted = results.length > 0 ? await saveDraws(activeVariant, results) : 0;
      await loadData();
      Alert.alert('Hoàn thành', `Đã tải ${inserted} kỳ mới`);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatsPress = () => {
    navigation.navigate('GameStats', { gameId: activeVariant });
  };

  const renderLatest = () => {
    if (!latestDraw) return null;

    if (is3D) {
      return (
        <Max3DResult
          numbers={latestDraw.numbers}
          drawNumber={latestDraw.draw_number}
          drawDate={latestDraw.draw_date}
          isProVariant={activeVariant === 'max3d_pro'}
        />
      );
    }

    const nums = [...latestDraw.numbers].sort((a, b) => a - b);
    return (
      <LatestResult
        drawNumber={latestDraw.draw_number}
        drawDate={latestDraw.draw_date}
        numbers={nums.map((n) => String(n).padStart(2, '0'))}
        specialNumber={
          latestDraw.special_number !== undefined
            ? String(latestDraw.special_number).padStart(2, '0')
            : undefined
        }
        jackpot={null}
        jackpotWinners={null}
      />
    );
  };

  const renderHeader = () => (
    <View>
      {/* Screen title */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{activeConfig.name}</Text>
        <Text style={styles.screenDays}>{activeConfig.drawDays}</Text>
      </View>

      {/* 3D variant tabs */}
      {is3D && (
        <View style={styles.variantTabs}>
          {(['max3d', 'max3d_pro'] as GameId[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.variantTab, activeVariant === v && styles.variantTabActive]}
              onPress={() => setActiveVariant(v)}
              activeOpacity={0.75}
            >
              <Text style={[styles.variantTabText, activeVariant === v && styles.variantTabTextActive]}>
                {GAME_CONFIGS[v].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.fetchBtn, loading && styles.fetchBtnDisabled]}
          onPress={handleFetch}
          disabled={loading}
          activeOpacity={0.75}
        >
          {loading && <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 6 }} />}
          <Text style={styles.fetchBtnText}>{loading ? 'Đang tải...' : 'Cập nhật'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statsBtn} onPress={handleStatsPress} activeOpacity={0.75}>
          <Text style={styles.statsBtnText}>
            {isPremium ? 'Thống kê' : '🔒 Thống kê'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Latest result */}
      {renderLatest()}

      {/* History section header */}
      <Text style={styles.historySectionLabel}>Lịch sử kết quả (30 ngày)</Text>
    </View>
  );

  const renderFooter = () => (
    <View>
      {adReady && <AdBanner placement="bottom" />}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.draw_number}
      renderItem={({ item }) => <DrawHistoryRow row={item} is3D={is3D} />}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có dữ liệu. Nhấn "Cập nhật" để tải.</Text>
        </View>
      }
    />
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.3,
  },
  screenDays: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  variantTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  variantTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  variantTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  variantTabText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  variantTabTextActive: {
    color: colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  fetchBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnDisabled: {
    opacity: 0.5,
  },
  fetchBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  statsBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 22,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  historySectionLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  historyRow: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderCard,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyMeta: {
    width: 70,
  },
  historyNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyBalls: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  historyBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBall3d: {
    width: 40,
    borderRadius: 7,
  },
  historyBallSpecial: {
    backgroundColor: 'rgba(74,140,200,0.2)',
  },
  historyBallText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
