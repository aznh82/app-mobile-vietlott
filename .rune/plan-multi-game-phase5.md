# Phase 5: Polish & Build

## Goal
Final integration: optimize ad placements across screens, verify offline data, update app metadata, build APK/AAB, and submit to Play Store. After this phase, app is production-ready.

## Data Flow
```
All screens → AdBanner (shared placements)
Premium toggle → hides ads on all screens
Offline mode → all screens read from SQLite cache
EAS Build → APK (preview) + AAB (production) → Play Store submit
```

## Code Contracts

```typescript
// No new interfaces — this phase integrates and polishes existing code

// src/components/AdBanner.tsx — verify works on all screens
// src/context/PremiumContext.tsx — verify premium unlocks all games
// src/services/interstitialAd.ts — verify triggers after multi-game fetch

// app.json — update version, verify plugins
// Update: version "1.2.0", add react-native-screens plugin if needed
```

## Tasks

- [ ] Task 1 — Verify and optimize ad placements
  - File: `src/screens/HomeScreen.tsx` (minor modify)
  - File: `src/screens/GameDetailScreen.tsx` (minor modify)
  - File: `src/screens/GameStatsScreen.tsx` (minor modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(ads): optimize ad placements across all screens`
  - Logic:
    - HomeScreen: 1 inline ad between game cards, 1 bottom banner
    - GameDetailScreen: 1 inline ad after latest result, 1 bottom banner
    - GameStatsScreen: 1 inline ad after frequency chart, 1 bottom banner
    - Interstitial: trigger after fetchAllGames (not per-game fetch)
    - Premium: all ads hidden when isPremium=true (verify this works)
  - Edge: AdBanner placement prop must handle new screen contexts

- [ ] Task 2 — Verify offline data access
  - File: N/A (manual verification)
  - Test: N/A
  - Verify: Manual test: enable airplane mode, verify all screens show cached data
  - Commit: N/A
  - Logic:
    - HomeScreen: shows cached latest results for all games
    - GameDetailScreen: shows cached draw history
    - GameStatsScreen: shows cached statistics
    - All screens show "offline" indicator or last-updated timestamp
    - No crash when network unavailable

- [ ] Task 3 — Update app metadata
  - File: `app.json` (modify)
  - Test: N/A
  - Verify: `cat app.json | grep version`
  - Commit: `chore: bump version to 1.2.0 for multi-game release`
  - Logic:
    - Version: "1.2.0"
    - Verify all plugins listed: expo-sqlite, react-native-google-mobile-ads
    - Add react-native-screens to plugins if needed by React Navigation
    - Verify android.permissions includes INTERNET, ACCESS_NETWORK_STATE
    - Verify android.package unchanged

- [ ] Task 4 — TypeScript full check and fix
  - File: Multiple (any TS errors)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `fix(types): resolve all TypeScript errors for production build`
  - Logic:
    - Run full tsc check
    - Fix any type errors from Phase 1-4
    - Ensure no `any` types in new code (existing `any` in MobileAds OK)
    - Verify all imports resolve correctly

- [ ] Task 5 — Build preview APK
  - File: N/A (build command)
  - Test: N/A
  - Verify: `npx eas-cli build --platform android --profile preview --non-interactive`
  - Commit: N/A
  - Logic: Build APK for testing on device before production build

- [ ] Task 6 — Build production AAB and prepare submit
  - File: N/A (build command)
  - Test: N/A
  - Verify: `npx eas-cli build --platform android --profile production --non-interactive`
  - Commit: N/A
  - Logic:
    - Build AAB for Play Store
    - Update store listing description to mention 5 games
    - Prepare changelogs for version 1.2.0

## Failure Scenarios

| When | Then | Error Type |
|------|------|-----------|
| EAS build fails | Check build logs, fix native config issues | Build error |
| AdMob crashes on new screens | Wrap in try/catch (existing pattern), app works without ads | console.warn |
| React Navigation plugin missing in app.json | Add react-native-screens to plugins array | Build error |
| TS errors from Phase 1-4 accumulation | Fix in Task 4 before building | tsc error |

## Rejection Criteria (DO NOT)
- ❌ DO NOT submit to Play Store without testing APK first
- ❌ DO NOT change AdMob app ID or banner unit ID
- ❌ DO NOT remove react-native-iap plugin (needed for premium)
- ❌ DO NOT skip TypeScript check before building
- ❌ DO NOT change app package name (org.vietlott.vietlott645)

## Cross-Phase Context
- **Assumes from Phase 1-4**: All code complete, compiles, navigation works
- **Exports**: Production APK/AAB ready for Play Store submission
- **Final state**: App supports 5 Vietlott games with navigation, statistics, ads, premium

## Acceptance Criteria
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Ad banners display on all screens (free users)
- [ ] Ads hidden for premium users
- [ ] Offline mode: all screens show cached data without crash
- [ ] Preview APK builds successfully
- [ ] Preview APK installs and runs on device
- [ ] All 5 games fetch and display data correctly
- [ ] Production AAB builds successfully
- [ ] Version bumped to 1.2.0

## Files Touched
- `src/screens/HomeScreen.tsx` — minor modify
- `src/screens/GameDetailScreen.tsx` — minor modify
- `src/screens/GameStatsScreen.tsx` — minor modify
- `app.json` — modify (version bump, plugins)
