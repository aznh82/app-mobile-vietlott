import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
// Vietlott 6/45: quay thưởng lúc 18:00 các ngày Thứ 2 (1), Thứ 4 (3), Thứ 6 (5)
const DRAW_DAYS = [1, 3, 5];
const DRAW_HOUR = 18;

function getNextDrawTime(): Date {
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    if (DRAW_DAYS.includes(candidate.getDay())) {
      if (i === 0 && now.getHours() >= DRAW_HOUR) continue;
      candidate.setHours(DRAW_HOUR, 0, 0, 0);
      return candidate;
    }
  }
  return now;
}

function formatDatePart(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dayName}, ngày ${dd}/${mm}/${yyyy}`;
}

function formatCountdown(target: Date): string {
  const now = new Date();
  let diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface LatestResultProps {
  drawNumber: string | null;
  drawDate: string | null;
  numbers: string[];
  specialNumber?: string;
  jackpot: string | null;
  jackpotWinners: string | null;
}

export default function LatestResult({
  drawNumber,
  drawDate,
  numbers,
  specialNumber,
  jackpot,
  jackpotWinners,
}: LatestResultProps) {
  // Blinking animation for winner text
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const winners = parseInt(jackpotWinners || '0', 10);
    if (winners > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [jackpotWinners]);

  // Cache nextDrawTime to avoid recalculating 7 Date objects every second
  const cachedTarget = useRef(getNextDrawTime());
  const [nextDrawDate, setNextDrawDate] = useState(formatDatePart(cachedTarget.current));
  const [countdown, setCountdown] = useState(formatCountdown(cachedTarget.current));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Only recalculate nextDrawTime when countdown reaches 0
      if (now.getTime() >= cachedTarget.current.getTime()) {
        cachedTarget.current = getNextDrawTime();
        setNextDrawDate(formatDatePart(cachedTarget.current));
      }
      setCountdown(formatCountdown(cachedTarget.current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
          {specialNumber !== undefined && (
            <View style={[styles.ball, styles.ballSpecial]}>
              <Text style={styles.ballText}>{specialNumber}</Text>
              <Text style={styles.sdbLabel}>SĐB</Text>
            </View>
          )}
        </View>
        {jackpot && (
          <View style={styles.jackpotContainer}>
            <Text style={styles.jackpotLabel}>GIÁ TRỊ JACKPOT</Text>
            <Text style={styles.jackpotValue}>{jackpot} VNĐ</Text>
            {parseInt(jackpotWinners || '0', 10) > 0 ? (
              <Animated.Text style={[styles.winnerAlert, { opacity: blinkAnim }]}>
                🎉 Hôm nay có {jackpotWinners} người trúng thưởng!
              </Animated.Text>
            ) : (
              <Text style={styles.jackpotLabel}>
                Số lượng giải: <Text style={styles.jackpotWinners}>0</Text>
              </Text>
            )}
          </View>
        )}
        <View style={styles.nextDrawContainer}>
          <Text style={styles.nextDrawLabel}>KỲ QUAY TIẾP THEO</Text>
          <Text style={styles.nextDrawCountdown}>Còn {countdown}</Text>
          <Text style={styles.nextDrawDate}>{nextDrawDate}</Text>
        </View>
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
  ballSpecial: {
    backgroundColor: colors.cold,
    shadowColor: colors.cold,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  sdbLabel: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: -2,
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
  winnerAlert: {
    fontSize: 13,
    color: '#ff3b30',
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  nextDrawContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38,53,69,0.6)',
    width: '100%',
  },
  nextDrawLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nextDrawCountdown: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  nextDrawDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
