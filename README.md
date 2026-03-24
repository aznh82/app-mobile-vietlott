# Vietlott — Kết quả xổ số

Ứng dụng tra cứu kết quả xổ số Vietlott, phân tích thống kê và gợi ý số thông minh cho 5 trò chơi.

---

## Tính năng

- **5 trò chơi**: Mega 6/45, Power 6/55, Lotto 5/35, Max 3D, Max 3D Pro
- **Kết quả mới nhất**: cào dữ liệu trực tiếp từ Vietlott, lưu cache SQLite offline
- **Bộ đếm ngược**: đếm đến kỳ quay thưởng tiếp theo theo lịch từng trò chơi
- **Thống kê tần suất**: biểu đồ tần suất xuất hiện của từng số theo kỳ lọc (15 ngày / 1 tháng / 3 tháng / 6 tháng)
- **Số vắng mặt**: theo dõi các số chưa xuất hiện lâu nhất
- **Gợi ý AI**: tạo bộ số dựa trên thuật toán thống kê (tần suất + số vắng)
- **Premium**: mở khóa gợi ý không giới hạn, ẩn quảng cáo (monthly / lifetime IAP)
- **Quảng cáo AdMob**: banner + interstitial cho người dùng free

## Screenshots

| Trang chủ | Chi tiết trò chơi | Thống kê |
|-----------|-------------------|----------|
| `store-assets/screenshot-home.png` | `store-assets/screenshot-detail.png` | `store-assets/screenshot-stats.png` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.83.2 + Expo SDK 55 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Database | expo-sqlite (5 tables, JSON array storage) |
| Ads | react-native-google-mobile-ads |
| IAP | react-native-iap |
| Tests | Jest 30 + ts-jest (17 tests, 96% coverage) |
| CI/CD | GitHub Actions (tsc + jest on push/PR) |
| Build | EAS Build (Expo Application Services) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (requires expo-dev-client build on device)
npx expo start --dev-client

# Type check
npx tsc --noEmit

# Run tests
npx jest --ci

# Build APK (preview)
npx eas-cli build --platform android --profile preview --non-interactive

# Build AAB (production)
npx eas-cli build --platform android --profile production --non-interactive
```

---

## Project Structure

```
App.tsx                  # Root: PremiumProvider → NavigationContainer → AppNavigator
src/
├── components/          # 11 UI components (AdBanner, FrequencyChart, SuggestedSets, …)
├── context/             # PremiumContext — premium state, IAP, ad control
├── database/            # SQLite layer — 5-table schema, migration from v1 legacy
├── hooks/               # useHomeDashboard — data fetching + state for home screen
├── navigation/          # AppNavigator — bottom tabs + per-game native stacks
├── screens/             # HomeScreen, GameDetailScreen, GameStatsScreen
├── services/            # scraper.ts (multi-game fetch), interstitialAd.ts
├── types/               # GameId, GameConfig, GAME_CONFIGS, navigation param types
└── utils/               # statistics.ts — frequency, suggestions (parameterized by GameId)
```

---

## Games

| Game | Draw Days | Numbers |
|------|-----------|---------|
| Mega 6/45 | T4, T6, CN | 6 of 1–45 |
| Power 6/55 | T3, T5, T7 | 6 of 1–55 + power ball |
| Lotto 5/35 | T3, T5, T7 | 5 of 1–35 + special |
| Max 3D | T2, T4, T6 | 3-digit pairs |
| Max 3D Pro | T3, T5, T7 | 3-digit pairs |

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 2.0.0 | 2026-03-24 | Multi-game expansion: 5 games, new navigation, CI pipeline |
| 1.1.1 | 2026-03-18 | Bug fixes: interstitial race condition, cold number detection |
| 1.1.0 | — | Hybrid monetization: AdMob + Premium IAP |
| 1.0.0 | — | Initial release — Mega 6/45 single-game app |

---

## License

MIT
