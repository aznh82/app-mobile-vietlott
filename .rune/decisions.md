# Architecture Decisions

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-03-18 | Hybrid monetization (Ads + Premium IAP) | Maximize revenue: free users see ads, premium removes ads + unlocks advanced features | Active |
| 2026-03-18 | SQLite (expo-sqlite) for local storage | Offline-first, fast queries, no server needed | Active |
| 2026-03-18 | Regex HTML parsing instead of cheerio | Smaller bundle, no native dependencies needed for Expo | Active |
| 2026-03-18 | Single-screen app (no navigation) | Simple UX for single-purpose lottery app | Active |
| 2026-03-18 | AdMob SDK wrapped in try/catch | App must work even if ads fail to load (graceful degradation) | Active |
| 2026-03-24 | Non-blocking AdMob SDK init | SDK init was crashing app on startup; made async with fallback | Active |
| 2026-03-24 | Added react-native-iap plugin to app.json | Missing native plugin caused crash when IAP module loaded | Active |
