# Developer Guide: Vietlott 6/45

## What This Does
Mobile app that scrapes Vietlott 6/45 lottery results, provides statistical analysis (frequency, absence tracking), and generates suggested number sets. Freemium model with ads for free users and Premium subscription.

## Quick Setup
```bash
# Install dependencies
npm install

# Run development server (requires dev client APK on device)
npx expo start --dev-client

# Build APK for testing
npx eas-cli build --platform android --profile preview --non-interactive

# Build AAB for Play Store
npx eas-cli build --platform android --profile production --non-interactive

# Generate app icons
node scripts/generate-icons.js
```

## Key Files
- `App.tsx` — Root component, wraps PremiumProvider
- `src/screens/HomeScreen.tsx` — Main (only) screen, orchestrates all data loading
- `src/services/scraper.ts` — Fetches results from Vietlott website via AJAX endpoints
- `src/database/database.ts` — SQLite database layer (draws table, queries)
- `src/utils/statistics.ts` — Frequency calculation, suggestion generation algorithms
- `src/context/PremiumContext.tsx` — Premium state, IAP purchases, ad control
- `src/components/AdBanner.tsx` — Google AdMob banner component
- `src/services/interstitialAd.ts` — Interstitial ad manager (singleton)
- `src/theme.ts` — Dark theme color palette
- `app.json` — Expo config, AdMob app ID, permissions

## How to Contribute
1. Branch from master
2. Make changes
3. Build and test on device: `npx eas-cli build --platform android --profile preview --non-interactive`
4. Open a PR — describe what and why

## Common Issues
- **App crashes on startup** — Usually AdMob SDK initialization. Check `app.json` has valid AdMob app ID under `plugins > react-native-google-mobile-ads`
- **Can't test on Expo Go** — App uses native modules (AdMob, IAP) which require a development build, not Expo Go
- **Scraper returns empty results** — Vietlott website may have changed HTML structure. Check `parseResults()` in `scraper.ts`
- **Build fails on EAS** — Ensure `eas.json` profiles are correct and you're logged in: `npx eas-cli login`
