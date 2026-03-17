import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { SuggestedSet } from '../utils/statistics';

interface SuggestedSetsProps {
  sets: SuggestedSet[];
  totalDraws: number;
  onRegenerate: () => void;
}

export default function SuggestedSets({
  sets,
  totalDraws,
  onRegenerate,
}: SuggestedSetsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>5 Bộ Số Gợi Ý</Text>
      <Text style={styles.infoText}>
        {sets.length > 0
          ? `Dựa trên ${totalDraws} kỳ — Bộ 4,5: số xanh từ vắng mặt lâu nhất`
          : '5 số nóng (cam) + 1 số ngẫu nhiên/vắng mặt (xanh)'}
      </Text>

      {sets.length === 0 ? (
        <Text style={styles.placeholder}>
          Nhấn "Cập nhật dữ liệu" để bắt đầu
        </Text>
      ) : (
        sets.map((set, i) => (
          <View key={i} style={styles.setCard}>
            <Text style={styles.setLabel}>Bộ {i + 1}</Text>
            <View style={styles.setBalls}>
              {set.numbers.map((num, j) => (
                <View
                  key={j}
                  style={[
                    styles.ball,
                    num === set.cold && styles.ballCold,
                  ]}
                >
                  <Text style={styles.ballText}>{num}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      <View style={styles.regenContainer}>
        <TouchableOpacity
          style={styles.regenBtn}
          onPress={onRegenerate}
          activeOpacity={0.7}
        >
          <Text style={styles.regenText}>Tạo lại bộ số</Text>
        </TouchableOpacity>
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
  setCard: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  setLabel: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
    minWidth: 40,
  },
  setBalls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ball: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballCold: {
    backgroundColor: colors.cold,
  },
  ballText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  regenContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  regenBtn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 20,
  },
  regenText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
