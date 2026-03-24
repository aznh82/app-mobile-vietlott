# Phase 1: Foundation & Navigation

## Goal
Create game config types, multi-game database schema (5 tables), and install/setup React Navigation with bottom tabs. After this phase, the app compiles with navigation skeleton — no data yet.

## Data Flow
```
GameConfig (type) → defines table name, number count, range
initDB() → creates 5 tables based on GameConfig[]
App.tsx → NavigationContainer → BottomTabNavigator → placeholder screens
```

## Code Contracts

```typescript
// src/types/game.ts
export type GameId = 'mega645' | 'power655' | 'lotto535' | 'max3d' | 'max3d_pro';

export interface GameConfig {
  id: GameId;
  name: string;           // "Mega 6/45"
  shortName: string;      // "6/45"
  tableName: string;      // "draws_645"
  numberCount: number;    // 6 (mega/power), 5 (lotto), 3 (max3d)
  maxNumber: number;      // 45, 55, 35, 999
  minNumber: number;      // 1 (lottery), 0 (max3d)
  hasSpecialNumber: boolean; // true for Lotto 5/35
  drawDays: string;       // "T4, T6, CN"
  pageUrl: string;        // path on vietlott.vn
  webPartClass: string;   // AjaxPro WebPart class name
  iconName: string;       // for tab bar icon
}

export const GAME_CONFIGS: Record<GameId, GameConfig>;

// src/database/database.ts — updated
export interface DrawRow {
  id: number;
  draw_number: string;
  draw_date: string;
  numbers: number[];  // Changed from n1-n6 to flexible array
  special_number?: number; // For Lotto 5/35
}

export function initDB(): Promise<void>;  // Creates 5 tables
export function saveDraws(gameId: GameId, draws: [string, string, number[], number?][]): Promise<number>;
export function getLatestDraw(gameId: GameId): Promise<string | null>;
export function getDrawsByPeriod(gameId: GameId, period: string): Promise<DrawRow[]>;
export function getTotalDraws(gameId: GameId): Promise<number>;
export function getLatestDrawFull(gameId: GameId): Promise<{...} | null>;
export function getLongestAbsent(gameId: GameId, limit?: number): Promise<{...}[]>;
```

## Tasks

- [ ] Task 1 — Create game config types and constants
  - File: `src/types/game.ts` (new)
  - Test: N/A (type-only, verified by tsc)
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(types): add GameConfig types and GAME_CONFIGS constants`
  - Logic: Define GameId union, GameConfig interface, GAME_CONFIGS map with all 5 games
  - Edge: Max 3D uses minNumber=0, maxNumber=999, numberCount depends on prize tier

- [ ] Task 2 — Refactor database to multi-game schema
  - File: `src/database/database.ts` (modify)
  - Test: N/A (runtime verified)
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(db): multi-game schema with separate tables per game`
  - Logic:
    - initDB creates 5 tables: draws_645 (keep existing data via migration), draws_655, draws_535, draws_max3d, draws_max3d_pro
    - Each table: id, draw_number, draw_date, numbers (JSON text), special_number (nullable)
    - Migrate existing `draws` table → `draws_645` (rename + convert n1-n6 to JSON array)
    - All query functions take gameId as first param, look up tableName from GAME_CONFIGS
    - getLongestAbsent takes gameId, uses config.maxNumber and config.minNumber for range
  - Edge: Migration must preserve existing 6/45 data. If draws table doesn't exist, skip migration.

- [ ] Task 3 — Install React Navigation dependencies
  - File: `package.json` (modify via npm)
  - Test: N/A
  - Verify: `npm ls @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context`
  - Commit: `chore(deps): add React Navigation for multi-screen support`
  - Logic: `npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context`

- [ ] Task 4 — Create navigation structure with placeholder screens
  - File: `src/navigation/AppNavigator.tsx` (new)
  - File: `src/screens/GameScreen.tsx` (new — placeholder)
  - File: `App.tsx` (modify — wrap with NavigationContainer)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(nav): add bottom tab navigation with placeholder screens`
  - Logic:
    - BottomTabNavigator with 5 tabs: Home, 6/45, 6/55, 5/35, Max3D
    - Each tab shows game name as placeholder text
    - HomeScreen stays as-is for now (will be redesigned in Phase 3)
    - Tab bar: dark theme matching colors.bgPrimary, accent color for active tab
    - App.tsx: PremiumProvider → NavigationContainer → AppNavigator

## Failure Scenarios

| When | Then | Error Type |
|------|------|-----------|
| Existing `draws` table has data | Migrate to `draws_645` preserving all rows | No error — graceful migration |
| Existing `draws` table doesn't exist (fresh install) | Skip migration, create all 5 tables fresh | No error |
| Migration fails mid-way | Log warning, create fresh table, data loss acceptable for beta | console.warn |
| GameId not found in GAME_CONFIGS | Throw Error("Unknown game: {id}") | Runtime error — programming bug |

## Rejection Criteria (DO NOT)
- ❌ DO NOT delete existing `draws` table data — must migrate to `draws_645`
- ❌ DO NOT use expo-router — use React Navigation (decision locked)
- ❌ DO NOT hardcode number ranges (1-45) — use GameConfig.maxNumber/minNumber
- ❌ DO NOT store numbers as individual columns (n1, n2...) — use JSON array in TEXT column
- ❌ DO NOT import from Phase 2+ files

## Cross-Phase Context
- **Assumes**: Nothing — this is Phase 1
- **Exports for Phase 2**: `GameConfig`, `GAME_CONFIGS`, all database functions with `gameId` param
- **Exports for Phase 3**: `AppNavigator` component, navigation structure
- **Interface contract**: `DrawRow.numbers` is always `number[]` — Phase 3+ depends on this

## Acceptance Criteria
- [ ] `src/types/game.ts` exists with GameConfig for all 5 games
- [ ] Database creates 5 separate tables
- [ ] Existing 6/45 data migrated to `draws_645`
- [ ] All DB functions accept `gameId` as first param
- [ ] React Navigation installed and app compiles
- [ ] Bottom tab navigator renders with 5 tabs
- [ ] `npx tsc --noEmit` passes with zero errors

## Files Touched
- `src/types/game.ts` — new
- `src/database/database.ts` — major modify (multi-game)
- `src/navigation/AppNavigator.tsx` — new
- `src/screens/GameScreen.tsx` — new (placeholder)
- `App.tsx` — modify (add NavigationContainer)
- `package.json` — modify (add deps)
