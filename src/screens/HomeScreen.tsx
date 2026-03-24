import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { GAME_CONFIGS, ALL_GAME_IDS } from '../types/game';
import type { GameId } from '../types/game';
import type { RootTabParamList } from '../types/navigation';
import useHomeDashboard from '../hooks/useHomeDashboard';
import AdBanner from '../components/AdBanner';
import PremiumBadge from '../components/PremiumBadge';
import PremiumPaywall from '../components/PremiumPaywall';
import UpgradePromptBanner from '../components/UpgradePromptBanner';
import GameResultCard from '../components/GameResultCard';

type HomeNavProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

const GAME_TAB_MAP: Record<GameId, keyof RootTabParamList> = {
  mega645: 'Game645',
  power655: 'Game655',
  lotto535: 'Game535',
  max3d: 'GameMax3D',
  max3d_pro: 'GameMax3D',
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { cardData, adReady, refreshing, onRefresh } = useHomeDashboard();
  const [showPaywall, setShowPaywall] = useState(false);

  const openPaywall = () => setShowPaywall(true);

  const handleCardPress = (gameId: GameId) => {
    navigation.navigate(GAME_TAB_MAP[gameId] as keyof RootTabParamList);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>VIETLOTT</Text>
            <Text style={styles.headerSubtitle}>Tổng hợp kết quả xổ số</Text>
          </View>
          <PremiumBadge onPress={openPaywall} />
        </View>
      </View>

      <PremiumPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* Game cards */}
      {ALL_GAME_IDS.map((gameId) => {
        const config = GAME_CONFIGS[gameId];
        const data = cardData[gameId];
        return (
          <GameResultCard
            key={gameId}
            gameId={gameId}
            config={config}
            drawNumber={data.drawNumber}
            drawDate={data.drawDate}
            numbers={data.numbers}
            specialNumber={data.specialNumber}
            onPress={() => handleCardPress(gameId)}
          />
        );
      })}

      <UpgradePromptBanner onUpgrade={openPaywall} />

      {adReady && <AdBanner placement="bottom" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
