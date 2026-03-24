# Feature: Multi-Game Expansion

## Overview
Expand Vietlott app from single-game (Mega 6/45) to 5 games. Add multi-screen navigation with home dashboard. Deadline: 26/03/2026.

## Phases
| # | Name | Status | Plan File | Summary |
|---|------|--------|-----------|---------|
| 1 | Foundation & Navigation | ⬚ Pending | plan-multi-game-phase1.md | Game config types, DB schema per game, React Navigation setup |
| 2 | Multi-Game Scraper | ⬚ Pending | plan-multi-game-phase2.md | Generic scraper for all 5 games, API endpoint configs |
| 3 | Screens & Home | ⬚ Pending | plan-multi-game-phase3.md | Home overview, per-game detail screens, tab navigation |
| 4 | Statistics & Premium | ⬚ Pending | plan-multi-game-phase4.md | Parameterized stats, per-game AI suggestions, premium gate |
| 5 | Polish & Build | ⬚ Pending | plan-multi-game-phase5.md | Ads integration, offline handling, EAS build, submit |

## Key Decisions
- **React Navigation** (bottom tabs) — mature, Expo-compatible
- **DB migration**: existing `draws` → `draws_645` preserving data
- **Numbers stored as JSON array** (not n1-n6 columns) — flexible for all games
- **Max 3D stats**: top/bottom 20 frequency (not all 1000 values)

## API Endpoints Discovered
| Game | WebPart Class | Verified |
|------|--------------|----------|
| Mega 6/45 | `Game645CompareWebPart` | Yes |
| Power 6/55 | `Game655CompareWebPart` | Yes |
| Lotto 5/35 | `Game535CompareWebPart` | Yes |
| Max 3D | `GameMax3DResultDetailWebPart` | Yes |
| Max 3D Pro | `GameMax3DProResultDetailWebPart` | TBD |

## Architecture
```
App.tsx → PremiumProvider → NavigationContainer
  ├── BottomTab: Home | 6/45 | 6/55 | 5/35 | Max3D
  ├── Each tab → Stack: GameDetail → GameStatistics
  └── Shared: AdBanner, PremiumPaywall
```

## Dependencies
- @react-navigation/native + @react-navigation/bottom-tabs: needs install
- react-native-screens + react-native-safe-area-context: needs install

## Risks
- Max 3D Pro endpoint chưa verify → fallback: scrape page to discover
- Deadline tight → Phase 5 là buffer
- Lotto 5/35 has special number → different parse logic
