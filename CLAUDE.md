# Vietlott 6/45 — Project Configuration

## Overview
React Native (Expo) mobile app for Vietnamese lottery Vietlott 6/45. Scrapes official results, provides frequency analysis, absent number tracking, and AI-suggested number sets. Freemium model with AdMob ads + Premium IAP.

## Tech Stack
- Framework: React Native 0.83.2 + Expo SDK 55
- Language: TypeScript 5.9
- Package Manager: npm
- Test Framework: none
- Build Tool: EAS Build (Expo Application Services)
- Linter: none configured

## Directory Structure
```
App.tsx                  # Root component (PremiumProvider → HomeScreen)
index.ts                 # Entry point (registerRootComponent)
src/
├── components/          # 10 UI components (AdBanner, FrequencyChart, etc.)
├── context/             # PremiumContext (premium state, IAP, ad control)
├── database/            # SQLite layer (expo-sqlite) — draws table
├── screens/             # HomeScreen (single-screen app)
├── services/            # scraper.ts (Vietlott API), interstitialAd.ts
├── utils/               # statistics.ts (frequency, suggestions)
└── theme.ts             # Color palette (dark theme)
assets/                  # App icons, splash screen
scripts/                 # generate-icons.js (sharp-based icon generator)
store-assets/            # Play Store listing assets
```

## Conventions
- Naming: PascalCase components, camelCase functions/variables, kebab-case files (except components)
- Components: functional with hooks, default export, StyleSheet at bottom of file
- Error handling: try/catch with Alert.alert for user-facing errors, console.warn for silent failures
- State management: React Context (PremiumContext) + local useState
- API pattern: direct fetch to Vietlott AJAX endpoints, HTML regex parsing (no cheerio)
- Data layer: expo-sqlite with parameterized queries, singleton database connection
- Ads: react-native-google-mobile-ads with try/catch fallback if SDK unavailable
- Numbers: always padded to 2 digits with String(n).padStart(2, '0')

## Commands
- Install: `npm install`
- Dev: `npx expo start --dev-client`
- Build APK: `npx eas-cli build --platform android --profile preview --non-interactive`
- Build AAB: `npx eas-cli build --platform android --profile production --non-interactive`
- Generate icons: `node scripts/generate-icons.js`

## Key Files
- Entry point: `App.tsx`, `index.ts`
- Config: `app.json`, `eas.json`, `tsconfig.json`
- Main screen: `src/screens/HomeScreen.tsx`
- Data scraper: `src/services/scraper.ts`
- Database: `src/database/database.ts`
- Statistics engine: `src/utils/statistics.ts`
- Premium system: `src/context/PremiumContext.tsx`
- Ad system: `src/components/AdBanner.tsx`, `src/services/interstitialAd.ts`
- Theme: `src/theme.ts`

## AdMob
- App ID: `ca-app-pub-5240031366086683~4032470389`
- Banner Unit: `ca-app-pub-5240031366086683/5898684425`
- Interstitial: configure in Google AdMob console
