import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { GameId, GameConfig } from '../types/game';
import { colors } from '../theme';

interface GameResultCardProps {
  gameId: GameId;
  config: GameConfig;
  drawNumber: string | null;
  drawDate: string | null;
  numbers: number[];
  specialNumber?: number;
  jackpot?: string | null;
  onPress: () => void;
}

function formatDate(drawDate: string | null): string {
  if (!drawDate) return '';
  if (drawDate.includes('-')) {
    const [y, m, d] = drawDate.split('-');
    return `${d}/${m}/${y}`;
  }
  return drawDate;
}

function LotteryBalls({ numbers, specialNumber }: { numbers: number[]; specialNumber?: number }) {
  return (
    <View style={styles.ballsRow}>
      {numbers.map((n, i) => (
        <View key={i} style={styles.ball}>
          <Text style={styles.ballText}>{String(n).padStart(2, '0')}</Text>
        </View>
      ))}
      {specialNumber !== undefined && (
        <View style={[styles.ball, styles.ballSpecial]}>
          <Text style={styles.ballText}>{String(specialNumber).padStart(2, '0')}</Text>
        </View>
      )}
    </View>
  );
}

function Max3DBalls({ numbers }: { numbers: number[] }) {
  const prize1 = numbers.slice(0, 2);
  return (
    <View style={styles.max3dContainer}>
      <Text style={styles.max3dLabel}>Giải ĐB</Text>
      <View style={styles.ballsRow}>
        {prize1.map((n, i) => (
          <View key={i} style={[styles.ball, styles.ball3d]}>
            <Text style={styles.ballText}>{String(n).padStart(3, '0')}</Text>
          </View>
        ))}
        {prize1.length < 2 && (
          <View style={[styles.ball, styles.ball3d]}>
            <Text style={styles.ballText}>---</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function GameResultCard({
  gameId,
  config,
  drawNumber,
  drawDate,
  numbers,
  specialNumber,
  jackpot,
  onPress,
}: GameResultCardProps) {
  const is3D = gameId === 'max3d' || gameId === 'max3d_pro';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.headerRow}>
        <View style={styles.gameBadge}>
          <Text style={styles.gameBadgeText}>{config.shortName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.gameName}>{config.name}</Text>
          <Text style={styles.drawDays}>{config.drawDays}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.inner}>
        {!drawNumber ? (
          <Text style={styles.placeholder}>Chưa có dữ liệu</Text>
        ) : (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.drawNum}>Kỳ #{drawNumber}</Text>
              <Text style={styles.drawDate}>{formatDate(drawDate)}</Text>
            </View>

            {is3D ? (
              <Max3DBalls numbers={numbers} />
            ) : (
              <LotteryBalls numbers={numbers} specialNumber={specialNumber} />
            )}

            {config.hasJackpot && jackpot != null && (
              <View style={styles.jackpotRow}>
                <Text style={styles.jackpotLabel}>JACKPOT</Text>
                <Text style={styles.jackpotValue}>{jackpot} VNĐ</Text>
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  gameBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  gameBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  headerRight: {
    flex: 1,
  },
  gameName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  drawDays: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '300',
  },
  inner: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  drawNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  drawDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  ballsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  ball: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ballSpecial: {
    backgroundColor: colors.cold,
    shadowColor: colors.cold,
  },
  ballText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  ball3d: {
    width: 50,
    height: 36,
    borderRadius: 10,
  },
  max3dContainer: {
    alignItems: 'center',
    gap: 4,
  },
  max3dLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jackpotRow: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderCard,
    width: '100%',
  },
  jackpotLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  jackpotValue: {
    color: colors.jackpotGold,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 2,
  },
});
