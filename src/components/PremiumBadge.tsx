import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { usePremium } from '../context/PremiumContext';

interface PremiumBadgeProps {
  onPress: () => void;
}

export default function PremiumBadge({ onPress }: PremiumBadgeProps) {
  const { isPremium } = usePremium();

  if (isPremium) {
    return (
      <TouchableOpacity style={styles.badgePremium} activeOpacity={0.8}>
        <Text style={styles.badgePremiumText}>👑 Premium</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.badge} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.badgeText}>⭐ Nâng cấp</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  badgePremium: {
    backgroundColor: 'rgba(245,200,66,0.15)',
    borderWidth: 1,
    borderColor: colors.jackpotGold,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgePremiumText: {
    color: colors.jackpotGold,
    fontSize: 12,
    fontWeight: '700',
  },
});
