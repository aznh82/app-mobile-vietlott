# Phase 4: Statistics & Premium

## Goal
Create per-game statistics screens with parameterized frequency analysis, absent number tracking, and AI suggestions. Gate advanced features behind premium. After this phase, all analytics features work for all 5 games.

## Data Flow
```
GameDetailScreen → "Thống kê" button → GameStatsScreen(gameId)
GameStatsScreen → getDrawsByPeriod(gameId, period) → calculateStats(draws, config)
calculateStats → NumberStats[] (frequency + absent per number in config range)
generateSuggestions(draws, absent, config) → SuggestedSet[] (premium-gated)
```

## Code Contracts

```typescript
// src/utils/statistics.ts — parameterized for multi-game

interface StatsConfig {
  numberCount: number;   // 6 (mega/power), 5 (lotto), 3 (max3d)
  minNumber: number;     // 1 (lottery), 0 (max3d)
  maxNumber: number;     // 45, 55, 35, 999
  numbersPerDraw: number; // how many numbers to extract per draw row
}

// Updated: accepts config instead of hardcoded 1-45
export function calculateStats(draws: DrawRow[], config: StatsConfig): NumberStats[];

// Updated: generates correct count of numbers per set based on config
export function generateSuggestions(
  draws: DrawRow[],
  absentData: { number: string; absent_draws: number }[],
  options?: SuggestionOptions & { config: StatsConfig }
): SuggestedSet[];

// src/screens/GameStatsScreen.tsx (new)
interface GameStatsScreenProps {
  route: { params: { gameId: GameId } };
}
export default function GameStatsScreen(props: GameStatsScreenProps): JSX.Element;
// Shows: PeriodFilter, FrequencyChart, AbsentNumbers, SuggestedSets
// Premium gate: free = limited stats, premium = full + AI suggestions

// src/database/database.ts — updated getLongestAbsent
export function getLongestAbsent(
  gameId: GameId,
  limit?: number
): Promise<{ number: string; absent_draws: number }[]>;
// Uses config.minNumber to config.maxNumber range instead of hardcoded 1-45
```

## Tasks

- [ ] Task 1 — Parameterize calculateStats
  - File: `src/utils/statistics.ts` (modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(stats): parameterize calculateStats for multi-game number ranges`
  - Logic:
    - Add StatsConfig param to calculateStats
    - Replace hardcoded `for (let n = 1; n <= 45; n++)` with `for (let n = config.minNumber; n <= config.maxNumber; n++)`
    - Extract numbers from DrawRow.numbers array (now flexible) instead of draw.n1-n6
    - For Max 3D: each of 20 numbers is independent (0-9 per digit, or 000-999 per number)
    - Pad labels: lottery = padStart(2, '0'), max3d = padStart(3, '0')
  - Edge: Max 3D range is 0-999 (1000 possible values) — frequency chart will be very wide. Consider digit-level analysis instead (frequency of each digit 0-9 at each position).

- [ ] Task 2 — Parameterize generateSuggestions
  - File: `src/utils/statistics.ts` (continue modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(stats): parameterize AI suggestions for multi-game`
  - Logic:
    - Accept StatsConfig in options
    - Generate config.numberCount numbers per set (6 for mega/power, 5 for lotto)
    - Number pool: config.minNumber to config.maxNumber
    - For Max 3D: generate 3-digit numbers (pick 1-3 numbers from frequent ones)
    - Adjust hot/warm/cold pool sizes proportionally to maxNumber
  - Edge: Lotto 5/35 generates 5 numbers (not 6). Strategies need fewer warm/cold slots.

- [ ] Task 3 — Create GameStatsScreen
  - File: `src/screens/GameStatsScreen.tsx` (new)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(screens): add per-game statistics screen`
  - Logic:
    - Receives gameId from navigation params
    - Build StatsConfig from GAME_CONFIGS[gameId]
    - PeriodFilter → loadStats(gameId, period)
    - FrequencyChart with data from calculateStats
    - AbsentNumbers from getLongestAbsent(gameId)
    - SuggestedSets (premium-gated): free = 3 basic sets, premium = 5 advanced sets
    - UpgradePromptBanner for free users
    - AdBanner placements
  - Edge: For Max 3D, FrequencyChart may need different visualization (1000 bars is too many). Option: show top 20 most frequent + bottom 20 least frequent.

- [ ] Task 4 — Update FrequencyChart for variable ranges
  - File: `src/components/FrequencyChart.tsx` (modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(ui): make FrequencyChart support variable number ranges`
  - Logic:
    - Accept dynamic data array (not hardcoded to 45 items)
    - If data.length > 50: show horizontal scrollable chart or top-N filter
    - Bar width scales based on data count
    - Label formatting: 2-digit for lottery, 3-digit for Max 3D
  - Edge: Max 3D has up to 1000 data points — must handle gracefully (filter/paginate)

- [ ] Task 5 — Add navigation to stats from GameDetailScreen
  - File: `src/navigation/AppNavigator.tsx` (modify)
  - File: `src/screens/GameDetailScreen.tsx` (modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(nav): add stats screen navigation from game detail`
  - Logic:
    - Each game tab uses a Stack navigator: GameDetail → GameStats
    - "Thống kê" button in GameDetailScreen navigates to GameStatsScreen
    - Pass gameId as navigation param
    - Back button returns to GameDetailScreen
  - Edge: Stack nested inside Tab — make sure header behavior is correct

## Failure Scenarios

| When | Then | Error Type |
|------|------|-----------|
| No draws for a game yet | Stats screen shows "Chưa có dữ liệu" + fetch prompt | No error |
| Max 3D frequency data too large | Show top 20 + bottom 20, hide middle | No error |
| calculateStats receives empty draws | Return empty NumberStats[] | No error |
| generateSuggestions with < 10 draws | Return fewer sets or basic random sets | No error — degraded quality OK |

## Rejection Criteria (DO NOT)
- ❌ DO NOT hardcode number range 1-45 anywhere — always use StatsConfig
- ❌ DO NOT show AI suggestions for free users beyond the basic 3 sets
- ❌ DO NOT extract numbers from draw.n1-n6 — use draw.numbers[] array (Phase 1 contract)
- ❌ DO NOT create a single "all games" stats screen — each game has its own stats screen (decision locked)
- ❌ DO NOT render 1000 bars in FrequencyChart for Max 3D — filter or paginate

## Cross-Phase Context
- **Assumes from Phase 1**: GameConfig, GAME_CONFIGS, DrawRow with numbers[] array, DB with gameId param
- **Assumes from Phase 2**: Scraper fetches data for all games
- **Assumes from Phase 3**: GameDetailScreen exists with "Thống kê" button, navigation structure
- **Exports for Phase 5**: Stats screens ready — Phase 5 only adds final ad placement + polish

## Acceptance Criteria
- [ ] calculateStats works for all 5 game configs (different ranges)
- [ ] generateSuggestions produces correct number count per game (6, 6, 5, variable)
- [ ] GameStatsScreen renders for each game type
- [ ] FrequencyChart handles both small (35-55 items) and large (1000 items) datasets
- [ ] Premium gate: free users see limited stats + upgrade prompt
- [ ] Navigation: GameDetail → GameStats → back works correctly
- [ ] `npx tsc --noEmit` passes

## Files Touched
- `src/utils/statistics.ts` — major modify
- `src/screens/GameStatsScreen.tsx` — new
- `src/components/FrequencyChart.tsx` — modify
- `src/screens/GameDetailScreen.tsx` — minor modify (add stats button)
- `src/navigation/AppNavigator.tsx` — modify (add stack nav)
- `src/database/database.ts` — minor modify (getLongestAbsent range)
