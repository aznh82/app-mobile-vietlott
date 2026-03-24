# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│  App.tsx                                                 │
│  PremiumProvider → NavigationContainer → AppNavigator    │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────────┐
         ▼               ▼                   ▼
    HomeScreen    GameDetailScreen    GameStatsScreen
    (dashboard)   (latest result +    (premium gated:
                   countdown)          freq / absent /
                                       suggestions)
         │               │
         ▼               ▼
  useHomeDashboard   GameId prop
  (custom hook)      ────────────────────────────────┐
         │           scraper.ts  →  saveDraws()      │
         │           (fetch all)    database.ts       │
         │                               │            │
         └──────── SQLite (vietlott.db) ◄┘            │
                   5 tables per GameId               │
                                                     │
                   statistics.ts ◄───────────────────┘
                   (frequency, absent, suggestions)
```

---

## Navigation Structure

```
Bottom Tab Navigator (AppNavigator)
├── Home          → HomeScreen
├── 6/45          → GameStack (mega645)
│                    ├── GameDetail
│                    └── GameStats
├── 6/55          → GameStack (power655)
│                    ├── GameDetail
│                    └── GameStats
├── 5/35          → GameStack (lotto535)
│                    ├── GameDetail
│                    └── GameStats
└── 3D            → GameStack (max3d)
                     ├── GameDetail
                     └── GameStats
```

Max 3D Pro results are shown inside the 3D tab's GameDetailScreen (same screen, both games fetched together).

---

## Data Flow

```
1. App launch
   initDB() — creates 5 tables; migrates legacy `draws` table if present

2. Home screen mount
   useHomeDashboard → fetchAllGames()
     └── scraper.ts: concurrent fetch for all 5 GameIds
         └── Vietlott AJAX endpoint (HTML regex parse)
         └── saveDraws(gameId, draws) → INSERT OR IGNORE into game table
         └── getLatestDrawFull(gameId) → DrawRow for each card

3. Game tab → GameDetailScreen
   scraper.fetchDraws(gameId, page) → paginated load
   database.getDrawsByPeriod(gameId, period) → filtered history

4. GameStatsScreen (premium)
   database.getDrawsByPeriod(gameId, period) → DrawRow[]
   statistics.getFrequency(draws, config) → frequency map
   statistics.getAbsentNumbers(draws, config) → sorted absent list
   statistics.getSuggestedSets(freq, absent, config) → number sets
```

---

## Multi-Game Config System

All game-specific behaviour is driven by `GAME_CONFIGS` in `src/types/game.ts`:

```
GameId → GameConfig {
  tableName     — SQLite table (draws_645, draws_655, …)
  numberCount   — how many numbers per draw
  minNumber     — range start (0 for Max 3D, 1 for others)
  maxNumber     — range end (45 / 55 / 35 / 999)
  hasSpecialNumber — Power 6/55 and Lotto 5/35
  drawDays      — display string for countdown logic
  pageUrl       — Vietlott website path for scraper
  webPartClass  — CSS class used in HTML regex parse
}
```

Every DB, scraper, and statistics function takes `gameId: GameId` as its first argument and reads config from `GAME_CONFIGS[gameId]`.

---

## Premium / Monetization Architecture

```
PremiumContext (React Context)
├── isPremium: boolean          — persisted in AsyncStorage
├── maxSuggestedSets: number    — 3 (free) / 10 (premium)
├── shouldShowInterstitial      — toggled after N fetches
├── incrementFetchCount()       — called on each data refresh
│
├── IAP (react-native-iap)
│   ├── vietlott_premium_monthly
│   └── vietlott_premium_lifetime
│
└── Ad triggers (react-native-google-mobile-ads)
    ├── AdBanner — rendered in GameDetailScreen (free only)
    └── interstitialAd.ts — shown when shouldShowInterstitial = true
```

GameStatsScreen checks `isPremium`; non-premium users see `PremiumPaywall` modal.

---

## Database Schema

Single file: `vietlott.db` (expo-sqlite, device-local)

```sql
-- Identical schema for all 5 tables
CREATE TABLE draws_{variant} (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  draw_number    TEXT UNIQUE NOT NULL,   -- e.g. "00892"
  draw_date      TEXT NOT NULL,          -- "YYYY-MM-DD"
  numbers        TEXT NOT NULL,          -- JSON array e.g. [3,17,22,34,40,45]
  special_number INTEGER                 -- NULL for Mega 6/45 and Max 3D
);
CREATE INDEX idx_draws_{variant}_date   ON draws_{variant}(draw_date);
CREATE INDEX idx_draws_{variant}_number ON draws_{variant}(draw_number);
```

Data retention: rows older than 400 days are removed by `cleanupOldData(gameId)`.
