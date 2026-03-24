import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { RootTabParamList, GameStackParamList } from '../types/navigation';
import type { GameId } from '../types/game';
import HomeScreen from '../screens/HomeScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import GameStatsScreen from '../screens/GameStatsScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<GameStackParamList>();

interface GameStackProps {
  initialGameId: GameId;
}

function GameStack({ initialGameId }: GameStackProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
      }}
    >
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        initialParams={{ gameId: initialGameId }}
      />
      <Stack.Screen
        name="GameStats"
        component={GameStatsScreen}
        initialParams={{ gameId: initialGameId }}
      />
    </Stack.Navigator>
  );
}

function Game645Stack() {
  return <GameStack initialGameId="mega645" />;
}

function Game655Stack() {
  return <GameStack initialGameId="power655" />;
}

function Game535Stack() {
  return <GameStack initialGameId="lotto535" />;
}

function GameMax3DStack() {
  return <GameStack initialGameId="max3d" />;
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.borderCard,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Game645"
        component={Game645Stack}
        options={{
          tabBarLabel: '6/45',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="Game655"
        component={Game655Stack}
        options={{
          tabBarLabel: '6/55',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚡</Text>,
        }}
      />
      <Tab.Screen
        name="Game535"
        component={Game535Stack}
        options={{
          tabBarLabel: '5/35',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍀</Text>,
        }}
      />
      <Tab.Screen
        name="GameMax3D"
        component={GameMax3DStack}
        options={{
          tabBarLabel: '3D',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎲</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
