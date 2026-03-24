# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] - 2026-03-24

### Added
- **Multi-game support**: Mega 6/45, Power 6/55, Lotto 5/35, Max 3D, Max 3D Pro
- **Navigation overhaul**: React Navigation 7 with bottom tab bar (Home + 4 game tabs) and per-game native stack (Detail → Stats)
- **GameDetailScreen**: per-game result display with countdown timer using game-specific draw schedule
- **GameStatsScreen**: frequency chart, absent numbers, AI suggestions — all parameterized by `GameId`
- **GAME_CONFIGS registry**: central config object mapping each `GameId` to table name, number range, draw days, API endpoint
- **5-table SQLite schema**: `draws_645`, `draws_655`, `draws_535`, `draws_max3d`, `draws_max3d_pro` with date and draw-number indexes
- **DB migration**: auto-migrates legacy `draws` table (n1–n6 columns) to `draws_645` JSON array schema on first launch
- **`useHomeDashboard` custom hook**: extracts all data-fetching and state logic from HomeScreen
- **HomeScreen dashboard**: `GameResultCard` tiles showing latest result per game with concurrent fetch
- **Max3DResult component**: prize-tier display for 3-digit pair games
- **`UpgradePromptBanner` component**: contextual premium upsell
- **Unit tests**: 17 tests for `statistics.ts` with 96% branch coverage (Jest 30 + ts-jest)
- **GitHub Actions CI**: type check (`tsc --noEmit`) + test (`jest --ci`) on every push and pull request
- **TypeScript strict types**: replaced all `any` types with proper interfaces across scraper, screens, and hooks

### Changed
- All DB and scraper functions now accept `gameId: GameId` as first parameter
- `statistics.ts` fully parameterized — frequency and suggestion algorithms work for all 5 games
- Scraper performs concurrent fetch for all games on home screen load
- Version bumped to 2.0.0 in `app.json` and `package.json`
- Project context docs updated for multi-game architecture

### Fixed
- Countdown timer now uses per-game draw schedule instead of hardcoded Mega 6/45 days
- Removed dead code paths left from single-game architecture

---

## [1.1.1] - 2026-03-18

### Fixed
- Interstitial ad timing race condition (ad shown before load complete)
- Cold number detection bug in absent-number algorithm
- AdMob SDK initialization made non-blocking to prevent app crash on cold start
- `react-native-iap` plugin added to `app.json` with `BILLING` permission to fix Play Store crash

### Changed
- Resolved 2 critical, 6 high, and 8 medium code quality issues identified by audit
- AdMob interstitial memory leak fixed (listener removed on unmount)
- IAP purchase verification hardened

---

## [1.1.0] - 2026-03-10

### Added
- **Hybrid monetization**: Google AdMob banner + interstitial ads (free tier)
- **Premium IAP**: monthly (`vietlott_premium_monthly`) and lifetime (`vietlott_premium_lifetime`) products via `react-native-iap`
- **PremiumContext**: global premium state, IAP lifecycle, ad-trigger logic
- **PremiumPaywall modal**: purchase and restore flow
- **PremiumBadge** and **UpgradePromptBanner** components
- Real AdMob unit IDs configured (`ca-app-pub-5240031366086683~4032470389`)
- Play Store listing assets added to `store-assets/`
- Blinking winner alert animation
- App renamed to "Vietlott"

### Changed
- Icon updated to orange background with lottery motif
- Interstitial shown every N data fetches (configurable via PremiumContext)
- Premium users: no ads, up to 10 suggested number sets (free: 3)

---

## [1.0.0] - 2026-02

### Added
- Initial release — Mega 6/45 single-game app
- Scrapes Vietlott AJAX endpoint with HTML regex parsing
- SQLite storage via expo-sqlite
- Frequency chart, absent numbers, AI-suggested number sets
- Dark theme
