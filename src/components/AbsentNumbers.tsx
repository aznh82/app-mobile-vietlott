import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { NumberStats } from '../utils/statistics';

interface AbsentNumbersProps {
  data: NumberStats[];
}

export default function AbsentNumbers({ data }: AbsentNumbersProps) {
  const sorted = [...data].sort((a, b) => b.absent - a.absent).slice(0, 10);
  const maxAbsent = Math.max(...sorted.map((n) => n.absent), 1);

  if (sorted.length === 0 || sorted[0].absent === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>10 Số Vắng Mặt Lâu Nhất</Text>
        <Text style={styles.infoText}>Số kỳ liên tiếp chưa xuất hiện</Text>
        <Text style={styles.placeholder}>
          Nhấn "Cập nhật dữ liệu" để bắt đầu
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>10 Số Vắng Mặt Lâu Nhất</Text>
      <Text style={styles.infoText}>Số kỳ liên tiếp chưa xuất hiện</Text>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colRank]}>#</Text>
        <Text style={[styles.headerText, styles.colNum]}>SỐ</Text>
        <Text style={[styles.headerText, styles.colAbsent]}>VẮNG</Text>
        <Text style={[styles.headerText, styles.colBar]}>MỨC ĐỘ</Text>
      </View>

      {sorted.map((item, i) => {
        const pct = Math.round((item.absent / maxAbsent) * 100);
        return (
          <View
            key={item.label}
            style={[styles.tableRow, i === sorted.length - 1 && styles.lastRow]}
          >
            <Text style={[styles.rankText, styles.colRank]}>{i + 1}</Text>
            <Text style={[styles.numText, styles.colNum]}>{item.label}</Text>
            <Text style={[styles.absentText, styles.colAbsent]}>
              {item.absent} kỳ
            </Text>
            <View style={[styles.colBar]}>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { width: `${pct}%` }]}>
                  <Text style={styles.barText}>{item.absent}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
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
    marginBottom: 10,
  },
  placeholder: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderCard,
    marginBottom: 1,
  },
  headerText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38,53,69,0.5)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  colRank: { width: 27 },
  colNum: { width: 39 },
  colAbsent: { width: 59 },
  colBar: { flex: 1 },
  rankText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  numText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  absentText: {
    fontSize: 12,
    color: colors.cold,
    fontWeight: '600',
  },
  barWrap: {
    backgroundColor: 'rgba(38,53,69,0.5)',
    borderRadius: 2,
    height: 17,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.cold,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 5,
    minWidth: 23,
  },
  barText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
});
