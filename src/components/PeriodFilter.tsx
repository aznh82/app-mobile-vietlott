import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

const PERIODS = [
  { key: '15d', label: '15 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '3m', label: '3 tháng' },
  { key: '6m', label: '6 tháng' },
] as const;

interface PeriodFilterProps {
  current: string;
  onChange: (period: string) => void;
}

export default function PeriodFilter({ current, onChange }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      {PERIODS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.btn, current === key && styles.btnActive]}
          onPress={() => onChange(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, current === key && styles.btnTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderCard,
    backgroundColor: 'transparent',
  },
  btnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  btnText: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
  },
  btnTextActive: {
    color: colors.accent,
  },
});
