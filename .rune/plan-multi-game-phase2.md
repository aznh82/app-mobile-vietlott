# Phase 2: Multi-Game Scraper

## Goal
Build a generic scraper factory that fetches draw results for all 5 games using Vietlott's AjaxPro API. After this phase, all 5 games can fetch and store historical data.

## Data Flow
```
GameConfig.webPartClass → buildAjaxUrl() → fetchPage(gameId, key, renderInfo, page)
fetchPage() → HTML string → parseResults(gameId, html) → [drawNumber, date, numbers[]][]
fetchAllFrom(gameId) → saveDraws(gameId, results) → SQLite per-game table
```

## Code Contracts

```typescript
// src/services/scraper.ts — refactored to multi-game

// Internal: build AJAX URL from GameConfig
function getAjaxUrl(gameId: GameId): string;
// Returns: `${BASE_URL}/ajaxpro/Vietlott.PlugIn.WebParts.${config.webPartClass},Vietlott.PlugIn.WebParts.ashx`

// Internal: get API key from game's page
function getApiKey(gameId: GameId): Promise<string>;
// Fetches config.pageUrl, extracts key via regex

// Internal: fetch one page of results
function fetchPage(gameId: GameId, key: string, renderInfo: any, pageIndex: number): Promise<string>;

// Internal: parse HTML into draw results
// For 6/45, 6/55: extracts 6 numbers from <span class="bong_tron">
// For 5/35: extracts 5 numbers + 1 special number
// For Max 3D: extracts prize-tier numbers (different HTML structure)
function parseResults(gameId: GameId, html: string): [string, string, number[], number?][];

// Public: fetch all history from startDraw
export function fetchAllFrom(
  gameId: GameId,
  startDraw?: string,
  onProgress?: (page: number, count: number) => void
): Promise<[string, string, number[], number?][]>;

// Public: fetch only new draws since latestDraw
export function fetchNew(
  gameId: GameId,
  latestDraw: string
): Promise<[string, string, number[], number?][]>;

// Public: fetch jackpot info (only for 6/45, 6/55)
export function fetchJackpotInfo(gameId: GameId): Promise<{
  jackpot: string | null;
  jackpot_winners: string | null;
}>;

// Public: fetch all games concurrently
export function fetchAllGames(
  onProgress?: (gameId: GameId, page: number, count: number) => void
): Promise<Record<GameId, number>>; // returns count of new draws per game
```

## Tasks

- [ ] Task 1 — Refactor scraper to use GameConfig
  - File: `src/services/scraper.ts` (major modify)
  - Test: N/A (verified by runtime + tsc)
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(scraper): parameterize by GameConfig for multi-game support`
  - Logic:
    - Replace hardcoded URLs/class names with GameConfig lookups
    - getAjaxUrl builds URL from config.webPartClass
    - getApiKey fetches config.pageUrl (full URL: BASE_URL + config.pageUrl)
    - fetchPage sends to getAjaxUrl(gameId) with correct X-AjaxPro-Method
    - Keep existing delay(300) between pages
  - Edge: getRenderInfo() stays shared (same for all games)

- [ ] Task 2 — Implement parseResults for lottery games (6/45, 6/55, 5/35)
  - File: `src/services/scraper.ts` (continue modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(scraper): add parse logic for 6/55 and 5/35 games`
  - Logic:
    - 6/45 and 6/55: same parse logic (6 numbers from bong_tron spans) — reuse existing
    - 5/35: parse 5 main numbers + 1 special number. Result format from API: "AABBCCDDEE|SS"
      where AA-EE are 5 numbers, SS is special. Parse accordingly.
    - Use config.numberCount to validate expected count
  - Edge: 5/35 special number stored as 4th element in tuple: [drawNum, date, numbers[], specialNum]

- [ ] Task 3 — Implement parseResults for Max 3D games
  - File: `src/services/scraper.ts` (continue modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(scraper): add Max 3D result parsing`
  - Logic:
    - Max 3D uses different API: GameMax3DResultDetailWebPart
    - Response has RetExtraParam1 (left content) + RetExtraParam2 (right content) instead of HtmlContent
    - Parse prize tiers: special (2 nums), first (4), second (6), third (8) = 20 numbers total
    - Store all 20 numbers as the numbers array
    - Max 3D Pro: try GameMax3DProResultDetailWebPart or similar endpoint
  - Edge: Max 3D API response structure differs (RetExtraParam1/2 vs HtmlContent). Handle both.

- [ ] Task 4 — Implement fetchAllGames concurrent loader
  - File: `src/services/scraper.ts` (continue modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `feat(scraper): add concurrent multi-game fetch`
  - Logic:
    - Promise.allSettled for all 5 games
    - Each game fetches independently — one failure doesn't block others
    - Returns Record<GameId, number> with count of new draws per game
    - Calls onProgress callback per game
  - Edge: If a game's API endpoint is wrong, catch and return 0 for that game

- [ ] Task 5 — Update HomeScreen to use new scraper API
  - File: `src/screens/HomeScreen.tsx` (modify)
  - Test: N/A
  - Verify: `npx tsc --noEmit`
  - Commit: `refactor(home): update to use multi-game scraper and database APIs`
  - Logic:
    - Change all database calls to pass 'mega645' as gameId
    - Change scraper calls to pass 'mega645' as gameId
    - This is a compatibility bridge — HomeScreen still shows only 6/45
    - Full redesign happens in Phase 3
  - Edge: Must not break existing functionality — app should work exactly as before

## Failure Scenarios

| When | Then | Error Type |
|------|------|-----------|
| Game's API endpoint returns 404 | Catch, return empty results, log warning | console.warn |
| API key regex doesn't match on new game page | Throw Error("Could not extract API key") — caught by fetchAllGames | Error |
| Max 3D response has different structure | Check for RetExtraParam1 first, fall back to HtmlContent | No error |
| One game fails in fetchAllGames | Promise.allSettled catches it, other games continue | Partial success |
| Network timeout during multi-game fetch | Each game has independent error handling | Per-game error |

## Rejection Criteria (DO NOT)
- ❌ DO NOT break existing 6/45 functionality — it must work exactly as before
- ❌ DO NOT fetch games sequentially — use Promise.allSettled for concurrency
- ❌ DO NOT hardcode API keys — always extract from page at runtime
- ❌ DO NOT remove the delay(300) between pages — rate limiting is important
- ❌ DO NOT use cheerio or DOM parser — stick with regex (project convention)

## Cross-Phase Context
- **Assumes from Phase 1**: GameConfig types, GAME_CONFIGS, database functions with gameId param
- **Exports for Phase 3**: fetchAllGames(), fetchNew(gameId), fetchJackpotInfo(gameId)
- **Exports for Phase 4**: fetchNew(gameId) for per-game refresh
- **Interface contract**: Parse result tuple [drawNumber, date, numbers[], specialNumber?] — Phase 3+ depends on this

## Acceptance Criteria
- [ ] scraper.ts compiles with no TS errors
- [ ] fetchAllFrom('mega645') returns same data as before refactor
- [ ] fetchAllFrom('power655') successfully fetches Power 6/55 results
- [ ] fetchAllFrom('lotto535') successfully fetches Lotto 5/35 results
- [ ] fetchAllFrom('max3d') successfully fetches Max 3D results
- [ ] fetchAllGames() runs all 5 games concurrently without blocking on failures
- [ ] HomeScreen still works (only shows 6/45 data)
- [ ] `npx tsc --noEmit` passes

## Files Touched
- `src/services/scraper.ts` — major modify
- `src/screens/HomeScreen.tsx` — minor modify (add gameId params)
