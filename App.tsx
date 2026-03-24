import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PremiumProvider } from './src/context/PremiumContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <PremiumProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
});
