# Detected Conventions

## Naming
- **Components**: PascalCase (`LatestResult.tsx`, `FrequencyChart.tsx`)
- **Services/Utils**: camelCase (`scraper.ts`, `statistics.ts`, `interstitialAd.ts`)
- **Functions**: camelCase (`getDrawsByPeriod`, `calculateStats`, `fetchNew`)
- **Constants**: UPPER_SNAKE_CASE (`START_DRAW`, `DRAW_DAYS`, `PRODUCTS`)
- **Interfaces**: PascalCase with descriptive suffix (`DrawRow`, `NumberStats`, `SuggestedSet`)

## Component Pattern
- Functional components with hooks
- `export default function ComponentName()` (not arrow function)
- Props interface defined inline above component
- `StyleSheet.create()` at bottom of file
- Colors imported from `../theme` — never hardcoded hex in components (except theme.ts)

## State Management
- React Context for global state (`PremiumContext`)
- `useState` for local UI state
- `useRef` for mutable values that don't trigger re-render (race condition guards, cached values)
- `useCallback` for memoized event handlers passed as props

## Data Flow
- HomeScreen is the orchestrator — all data loading happens here
- Database functions are async, return typed results
- Scraper returns raw tuples: `[drawNumber, date, numbers[]]`
- Statistics functions are pure (no side effects)

## Error Handling
- User-facing: `Alert.alert()` with title + message
- Silent/optional: `try/catch` with `console.warn()`
- AdMob/IAP: wrapped in try/catch — app works without them
- Network errors distinguished from parse errors via string matching

## Database
- Singleton pattern via `getDatabase()`
- All queries use parameterized `?` placeholders (SQL injection safe)
- `expo-sqlite` async API (`runAsync`, `getAllAsync`, `getFirstAsync`)
- Draws stored with individual columns (n1-n6), not array

## Number Formatting
- Always padded: `String(n).padStart(2, '0')` — "01" through "45"
- Sorted ascending for display: `.sort((a, b) => a - b)`
