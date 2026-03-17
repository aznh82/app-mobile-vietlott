import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors } from '../theme';
import { NumberStats } from '../utils/statistics';

interface FrequencyChartProps {
  data: NumberStats[];
  totalDraws: number;
}

type SortMode = 'order' | 'freq';

export default function FrequencyChart({ data, totalDraws }: FrequencyChartProps) {
  const [sortMode, setSortMode] = useState<SortMode>('order');

  const sorted = [...data];
  if (sortMode === 'freq') {
    sorted.sort((a, b) => b.freq - a.freq);
  }

  const maxFreq = Math.max(...sorted.map((n) => n.freq), 1);
  const barMaxHeight = 200;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Tần suất xuất hiện các số (01 - 45)</Text>
      <Text style={styles.infoText}>Dữ liệu từ {totalDraws} kỳ quay</Text>

      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[styles.sortBtn, sortMode === 'order' && styles.sortBtnActive]}
          onPress={() => setSortMode('order')}
        >
          <Text
            style={[
              styles.sortBtnText,
              sortMode === 'order' && styles.sortBtnTextActive,
            ]}
          >
            Theo thứ tự
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, sortMode === 'freq' && styles.sortBtnActive]}
          onPress={() => setSortMode('freq')}
        >
          <Text
            style={[
              styles.sortBtnText,
              sortMode === 'freq' && styles.sortBtnTextActive,
            ]}
          >
            Theo lượt về
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          {sorted.map((item, i) => {
            const ratio = item.freq / maxFreq;
            const barHeight = Math.max(item.freq > 0 ? 4 : 0, ratio * barMaxHeight);
            let barColor: string;
            if (ratio > 0.8) barColor = '#d45a1e';
            else if (ratio > 0.6) barColor = '#c88530';
            else if (ratio > 0.4) barColor = '#6a8fa8';
            else if (ratio > 0.2) barColor = '#3d6d8e';
            else barColor = '#2a4f6a';

            return (
              <View key={i} style={styles.barColumn}>
                <Text style={styles.freqLabel}>{item.freq || ''}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    },
                  ]}
                />
                <Text style={styles.numberLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  sortBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  sortBtn: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.borderCard,
    backgroundColor: 'transparent',
  },
  sortBtnActive: {
    backgroundColor: colors.bgCardInner,
    borderColor: colors.textSecondary,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sortBtnTextActive: {
    color: colors.textPrimary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingBottom: 4,
    minHeight: 260,
  },
  barColumn: {
    alignItems: 'center',
    width: 11,
    marginHorizontal: 0,
  },
  freqLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 1,
  },
  bar: {
    width: 8,
    borderRadius: 1.5,
    minWidth: 8,
  },
  numberLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 2,
  },
});
