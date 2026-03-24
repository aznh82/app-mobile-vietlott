# Feature: Multi-Game Expansion

## Overview
Expand Vietlott app from single-game (Mega 6/45) to 5 games. Add multi-screen navigation
with home dashboard. Deadline: 26/03/2026.

## Games in Scope
| Game | Screen | Numbers | Draw Days |
|------|--------|---------|-----------|
| Mega 6/45 | Separate tab | 6 of 1–45 | T4, T6, CN |
| Power 6/55 | Separate tab | 6 of 1–55 + power | T3, T5, T7 |
| Lotto 5/35 | Separate tab | 5 of 1–35 + special | T3, T5, T7 |
| Max 3D | Shared tab | 3-digit pairs | T2, T4, T6 |
| Max 3D Pro | Shared tab (toggle) | 3-digit pairs | T3, T5, T7 |

## Phases
| # | Name | Status | Plan File | Timeline |
|---|------|--------|-----------|----------|
| 1 | Backend | ✅ Done | plan-multi-game-phase1.md | 24/03 evening (~4h) |
| 2 | Frontend | ✅ Done | plan-multi-game-phase2.md | 25/03 full day (~6–8h) |
| 3 | Ship | ⬚ Pending | plan-multi-game-phase3.md | 26/03 morning (~3h) |

## Key Decisions
- **React Navigation** (bottom tabs) — mature, Expo-compatible, decision locked
- **DB migration**: existing `draws` → `draws_645` preserving all historical data
- **Numbers stored as JSON array** in TEXT column — flexible for all game types
- **Max 3D + Pro on one screen** — internal toggle, not a separate tab
- **Statistics screen separate** from detail screen — navigated via "Thống kê" button
- **Premium gates stats screen** — free users see home + detail only
- **Max 3D stats**: top/bottom 20 frequency (not all 1000 combinations)

## API Endpoints
| Game | WebPart Class | Verified |
|------|--------------|----------|
| Mega 6/45 | `Game645CompareWebPart` | Yes |
| Power 6/55 | `Game655CompareWebPart` | Yes |
| Lotto 5/35 | `Game535CompareWebPart` | Yes |
| Max 3D | `GameMax3DResultDetailWebPart` | Yes |
| Max 3D Pro | `GameMax3DProResultDetailWebPart` | Yes |

## Architecture
```
App.tsx
└── PremiumProvider
    └── NavigationContainer
        └── BottomTabNavigator
            ├── Tab: Home       → HomeScreen (5-game dashboard)
            ├── Tab: 6/45       → Stack → GameDetailScreen → GameStatsScreen
            ├── Tab: 6/55       → Stack → GameDetailScreen → GameStatsScreen
            ├── Tab: 5/35       → Stack → GameDetailScreen → GameStatsScreen
            └── Tab: Max 3D     → Stack → GameDetailScreen (toggle 3D/Pro) → GameStatsScreen
```

## Phase Dependencies
```
Phase 1 (types + DB + nav skeleton)
    ↓ exports: GameConfig, DB functions, AppNavigator
Phase 2 (scrapers + screens + statistics)
    ↓ exports: all screens wired, stats working, all scraper functions
Phase 3 (ads + premium + build)
```

## Risks
| Risk | Mitigation |
|------|-----------|
| Max 3D response structure differs from lottery | Check RetExtraParam1/2 fields, tested in Phase 1 scraper task |
| Deadline tight | Phase 3 is minimal — ads/premium already coded, just wire up |
| Lotto 5/35 special number parsing | Separate parse branch by gameId |
| Navigation type errors in TS | Define RootParamList in types/navigation.ts Phase 1 |
