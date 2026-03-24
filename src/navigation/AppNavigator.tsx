import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { RootTabParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
      <Text style={styles.placeholderSub}>Coming soon...</Text>
    </View>
  );
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
        options={{
          tabBarLabel: '6/45',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text>,
        }}
      >
        {() => <PlaceholderScreen name="Mega 6/45" />}
      </Tab.Screen>
      <Tab.Screen
        name="Game655"
        options={{
          tabBarLabel: '6/55',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚡</Text>,
        }}
      >
        {() => <PlaceholderScreen name="Power 6/55" />}
      </Tab.Screen>
      <Tab.Screen
        name="Game535"
        options={{
          tabBarLabel: '5/35',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍀</Text>,
        }}
      >
        {() => <PlaceholderScreen name="Lotto 5/35" />}
      </Tab.Screen>
      <Tab.Screen
        name="GameMax3D"
        options={{
          tabBarLabel: '3D',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎲</Text>,
        }}
      >
        {() => <PlaceholderScreen name="Max 3D / 3D Pro" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  placeholderText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  placeholderSub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
});
