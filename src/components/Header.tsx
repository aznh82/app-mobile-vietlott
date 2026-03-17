import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';

interface HeaderProps {
  totalDraws: number;
  latestDraw: string | null;
  loading: boolean;
  onFetch: () => void;
}

export default function Header({
  totalDraws,
  latestDraw,
  loading,
  onFetch,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>VIETLOTT 6/45</Text>
        <Text style={styles.subtitle}>Thống kê & Dự đoán xác suất</Text>
      </View>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statText}>
            Tổng kỳ: <Text style={styles.statValue}>{totalDraws}</Text>
          </Text>
          <Text style={styles.statText}>
            Kỳ mới nhất:{' '}
            <Text style={styles.statValue}>{latestDraw || '--'}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.fetchBtn, loading && styles.fetchBtnDisabled]}
          onPress={onFetch}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading && (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.fetchBtnText}>
            {loading ? 'Đang tải...' : 'Cập nhật dữ liệu'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  statValue: {
    color: colors.accent,
    fontWeight: '700',
  },
  fetchBtn: {
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fetchBtnDisabled: {
    opacity: 0.5,
  },
  fetchBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
