import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Max3DResultProps {
  numbers: number[];
  drawNumber: string;
  drawDate: string;
  isProVariant?: boolean;
}

interface PrizeTierProps {
  label: string;
  nums: number[];
  expected: number;
}

function formatDate(drawDate: string): string {
  if (drawDate.includes('-')) {
    const [y, m, d] = drawDate.split('-');
    return `${d}/${m}/${y}`;
  }
  return drawDate;
}

function PrizeTier({ label, nums, expected }: PrizeTierProps) {
  const rendered: string[] = [];
  for (let i = 0; i < expected; i++) {
    if (i < nums.length) {
      rendered.push(String(nums[i]).padStart(3, '0'));
    } else {
      rendered.push('---');
    }
  }

  return (
    <View style={styles.tierRow}>
      <Text style={styles.tierLabel}>{label}</Text>
      <View style={styles.tierNumbers}>
        {rendered.map((val, i) => (
          <View key={i} style={styles.numBox}>
            <Text style={styles.numText}>{val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Max3DResult({
  numbers,
  drawNumber,
  drawDate,
  isProVariant = false,
}: Max3DResultProps) {
  // Prize tiers: ĐB (2), nhất (4), nhì (6), ba (8)
  const prize1 = numbers.slice(0, 2);
  const prize2 = numbers.slice(2, 6);
  const prize3 = numbers.slice(6, 12);
  const prize4 = numbers.slice(12, 20);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>
          {isProVariant ? 'Max 3D Pro — Kết Quả' : 'Max 3D — Kết Quả'}
        </Text>
      </View>
      <View style={styles.inner}>
        <View style={styles.metaRow}>
          <Text style={styles.drawNum}>Kỳ #{drawNumber}</Text>
          <Text style={styles.drawDate}>{formatDate(drawDate)}</Text>
        </View>
        <PrizeTier label="Giải ĐB" nums={prize1} expected={2} />
        <PrizeTier label="Giải nhất" nums={prize2} expected={4} />
        <PrizeTier label="Giải nhì" nums={prize3} expected={6} />
        <PrizeTier label="Giải ba" nums={prize4} expected={8} />
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inner: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  drawNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  drawDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tierLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 70,
    paddingTop: 6,
  },
  tierNumbers: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  numBox: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
