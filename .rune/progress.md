# Progress Log

## 2026-03-24 — Crash Fix Sprint
- Isolated AdMob SDK crash: made initialization non-blocking with try/catch
- Added react-native-iap plugin + BILLING permission to fix IAP crash
- Tested AdMob-only build to isolate crash source
- Onboard re-run: all context files current

## 2026-03-18 — v1.1.1 Release
- Core features complete: scraper, statistics, suggestions, absent tracking
- Hybrid monetization: AdMob banner/interstitial + Premium IAP
- Privacy Policy hosted on GitHub Pages
- AAB production build submitted
- Development client APK available for testing
- Known issue: APK crashes on startup (investigating AdMob SDK init)
