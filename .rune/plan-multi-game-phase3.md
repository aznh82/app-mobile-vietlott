# Phase 3: Screens & Home

## Goal
Redesign HomeScreen as overview dashboard (latest results for all 5 games), create per-game detail screens with draw history, and wire up tab navigation. After this phase, users can navigate between games and see results.

## Data Flow
```
App opens → HomeScreen → fetchAllGames() → show latest result per game (from DB)
User taps game card → navigate to GameDetailScreen(gameId)
GameDetailScreen → getDrawsByPeriod(gameId) → render draw history list
GameDetailScreen → pull-to-refresh → fetchNew(gameId) → update list
```

## Code Contracts

```typescript
// src/screens/HomeScreen.tsx — redesigned as overview dashboard
// Shows: GameResultCard for each of 5 games, tap navigates to detail
// Fetches: latest draw for each game from DB on mount
// Pull-to-refresh: calls fetchAllGames() then reloads all

// src/components/GameResultCard.tsx (new)
interface GameResultCardProps {
  gameId: GameId;
  gameName: string;
  drawNumber: string | null;
  drawDate: string | null;
  numbers: string[];
  specialNumber?: string;
  jackpot?: string | null;
  onPress: () => void;
}
export default function GameResultCard(props: GameResultCardProps): JSX.Element;

// src/screens/GameDetailScreen.tsx (new — replaces placeholder)
// Per-game screen: draw history, jackpot info, fetch button
// Reuses existing components: Header, LatestResult, PeriodFilter, AdBanner
interface GameDetailScreenProps {
  route: { params: { gameId: GameId } };
  navigation: any;
}
export default function GameDetailScreen(props: GameDetailScreenProps): JSX.Element;

// src/components/Max3DResult.tsx (new)
// Special component for Max 3D prize display (tiers: special, 1st, 2nd, 3rd)
interface Max3DResultProps {
  numbers: number[];  // 20 numbers across prize tiers
  drawNumber: string;
  drawDate: string;
}
export default function Max3DResult(props: Max3DResultProps): JSX.Element;
```

## Tasks

- [ ] Task 1 — Create GameResultCard component
  - File: `src/components/GameResultCard.tsx` (new)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(ui): add GameResultCard for home screen overview`
  - Logic:
    - Card with game name, latest draw date/number, number balls
    - For lottery games (6/45, 6/55, 5/35): show colored number balls (reuse bong_tron style)
    - For Max 3D: show "Giải ĐB: XXX, XXX" (just special prize numbers)
    - Jackpot amount if available (6/45, 6/55 only)
    - Touchable → onPress navigates to detail
    - Dark theme, match existing color palette
  - Edge: If no data yet (first launch before scrape), show "Chưa có dữ liệu" placeholder

- [ ] Task 2 — Redesign HomeScreen as dashboard
  - File: `src/screens/HomeScreen.tsx` (major rewrite)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(home): redesign as multi-game dashboard with result cards`
  - Logic:
    - On mount: load latest draw for each game from DB (getLatestDrawFull per game)
    - Display 5 GameResultCards in a ScrollView
    - Pull-to-refresh: fetchAllGames() then reload all cards
    - First launch detection: if no data for any game → trigger fetchAllGames with progress modal
    - Keep AdBanner (top inline + bottom)
    - Keep PremiumBadge in header
    - Remove: FrequencyChart, AbsentNumbers, SuggestedSets, PeriodFilter (moved to stats screen)
  - Edge: AdMob init stays in HomeScreen (or move to App.tsx). Progress modal for first-time scrape.

- [ ] Task 3 — Create GameDetailScreen
  - File: `src/screens/GameDetailScreen.tsx` (new, replaces GameScreen.tsx placeholder)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(screens): add per-game detail screen with draw history`
  - Logic:
    - Receives gameId from navigation params
    - Load game config from GAME_CONFIGS[gameId]
    - Show latest result (reuse LatestResult component, adapt for different number counts)
    - Show draw history list (FlatList with date, draw number, numbers)
    - Pull-to-refresh: fetchNew(gameId) → saveDraws → reload
    - Jackpot info: only fetch for 6/45, 6/55 (games with jackpot)
    - "Thống kê" button → navigates to statistics screen (Phase 4)
    - AdBanner at bottom
  - Edge: Max 3D detail uses Max3DResult component instead of LatestResult

- [ ] Task 4 — Create Max3DResult component
  - File: `src/components/Max3DResult.tsx` (new)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(ui): add Max3DResult prize tier display component`
  - Logic:
    - Display 4 prize tiers: Giải ĐB (2 nums), Giải nhất (4), Giải nhì (6), Giải ba (8)
    - Each number displayed as 3-digit padded: "003", "297"
    - Prize tier headers with matching colors
    - Compact layout — 20 numbers total
  - Edge: If numbers array length !== 20, show available numbers with warning

- [ ] Task 5 — Update navigation with real screens
  - File: `src/navigation/AppNavigator.tsx` (modify)
  - File: `src/screens/GameScreen.tsx` (delete — replaced by GameDetailScreen)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(nav): wire up real screens to tab navigator`
  - Logic:
    - Home tab → HomeScreen (dashboard)
    - Each game tab → GameDetailScreen with gameId param
    - Max 3D tab: single tab, GameDetailScreen handles both Max 3D + Pro (internal tab/toggle)
    - Tab bar icons: use simple text or emoji initially (can improve later)
    - Tab bar style: dark background, accent color active, muted inactive
  - Edge: Navigation params must be typed correctly for TypeScript

- [ ] Task 6 — Adapt LatestResult component for multi-game
  - File: `src/components/LatestResult.tsx` (modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(ui): make LatestResult support variable number counts`
  - Logic:
    - Accept optional specialNumber prop (for 5/35)
    - Accept dynamic numbers array (5, 6, or variable length)
    - Show special number with different color/label for 5/35
    - No hardcoded assumption about 6 numbers
  - Edge: If numbers.length === 0, show placeholder

## Failure Scenarios

| When | Then | Error Type |
|------|------|-----------|
| No data for a game (first launch) | GameResultCard shows "Chưa có dữ liệu" | No error |
| fetchAllGames partial failure | Show results for successful games, retry option for failed | Alert per failed game |
| Navigation to game with no data | GameDetailScreen shows empty state + fetch button | No error |
| Max 3D numbers array wrong length | Show available numbers, log warning | console.warn |

## Rejection Criteria (DO NOT)
- ❌ DO NOT keep statistics components in HomeScreen — they move to separate stats screen (Phase 4)
- ❌ DO NOT hardcode 6 numbers in LatestResult — use dynamic array
- ❌ DO NOT create separate navigation for Max 3D Pro — it's a tab/toggle inside Max 3D screen
- ❌ DO NOT use any new UI library (no NativeBase, no Paper) — stick with StyleSheet
- ❌ DO NOT import statistics functions — they belong to Phase 4

## Cross-Phase Context
- **Assumes from Phase 1**: GameConfig, GAME_CONFIGS, DB functions with gameId, AppNavigator skeleton
- **Assumes from Phase 2**: fetchAllGames(), fetchNew(gameId), parseResults for all games
- **Exports for Phase 4**: GameDetailScreen has "Thống kê" button ready (navigates to stats)
- **Exports for Phase 5**: All screens ready for ad placement optimization

## Acceptance Criteria
- [ ] HomeScreen shows 5 GameResultCards with latest results
- [ ] Tapping a card navigates to correct GameDetailScreen
- [ ] GameDetailScreen shows draw history for selected game
- [ ] Pull-to-refresh works on both Home and Detail screens
- [ ] Max 3D screen shows prize tier layout
- [ ] LatestResult supports 5, 6, and variable number counts
- [ ] First launch triggers fetch-all with progress indicator
- [ ] Navigation between tabs is smooth (< 300ms)
- [ ] `npx tsc --noEmit` passes

## Files Touched
- `src/screens/HomeScreen.tsx` — major rewrite
- `src/screens/GameDetailScreen.tsx` — new
- `src/screens/GameScreen.tsx` — delete
- `src/components/GameResultCard.tsx` — new
- `src/components/Max3DResult.tsx` — new
- `src/components/LatestResult.tsx` — modify
- `src/navigation/AppNavigator.tsx` — modify
