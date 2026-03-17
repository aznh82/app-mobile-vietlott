import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface LatestResultProps {
  drawNumber: string | null;
  drawDate: string | null;
  numbers: string[];
  jackpot: string | null;
  jackpotWinners: string | null;
}

export default function LatestResult({
  drawNumber,
  drawDate,
  numbers,
  jackpot,
  jackpotWinners,
}: LatestResultProps) {
  if (!drawNumber) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.ball6}>
            <Text style={styles.ball6Text}>6</Text>
          </View>
          <Text style={styles.sectionTitle}>Kết Quả Mở Thưởng</Text>
        </View>
        <View style={styles.inner}>
          <Text style={styles.placeholder}>
            Nhấn "Cập nhật dữ liệu" để bắt đầu
          </Text>
        </View>
      </View>
    );
  }

  // Format date from yyyy-mm-dd to dd/mm/yyyy
  let displayDate = drawDate || '';
  if (drawDate && drawDate.includes('-')) {
    const [y, m, d] = drawDate.split('-');
    displayDate = `${d}/${m}/${y}`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
          <View style={styles.ball6}>
            <Text style={styles.ball6Text}>6</Text>
          </View>
          <Text style={styles.sectionTitle}>Kết Quả Mở Thưởng</Text>
        </View>
      <View style={styles.inner}>
        <View style={styles.labelContainer}>
          <Text style={styles.drawNum}>Kỳ #{drawNumber}</Text>
          <Text style={styles.drawDate}>{displayDate}</Text>
        </View>
        <View style={styles.ballsRow}>
          {numbers.map((n, i) => (
            <View key={i} style={styles.ball}>
              <Text style={styles.ballText}>{n}</Text>
            </View>
          ))}
        </View>
        {jackpot && (
          <View style={styles.jackpotContainer}>
            <Text style={styles.jackpotLabel}>GIÁ TRỊ JACKPOT</Text>
            <Text style={styles.jackpotValue}>{jackpot} VNĐ</Text>
            <Text style={styles.jackpotLabel}>
              Số lượng giải:{' '}
              <Text style={styles.jackpotWinners}>
                {jackpotWinners || '0'}
              </Text>
            </Text>
          </View>
        )}
      </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ball6: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a6b35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ball6Text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inner: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  placeholder: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelContainer: {
    alignItems: 'center',
  },
  drawNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  drawDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  ballsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  ball: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ballText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  jackpotContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  jackpotLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  jackpotValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.jackpotGold,
    marginVertical: 2,
  },
  jackpotWinners: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
