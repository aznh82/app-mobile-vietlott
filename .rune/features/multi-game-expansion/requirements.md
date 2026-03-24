# Requirements Document: Multi-Game Expansion
Created: 2026-03-24 | BA Session: Expand from Mega 6/45 to 5 Vietlott products

## Context
App hiện chỉ hỗ trợ Mega 6/45. Cần mở rộng sang 5 sản phẩm Vietlott (loại bỏ Keno + BINGO18) để tăng user base, retention, và ad revenue. Chuyển từ single-screen sang multi-screen app với trang chủ tổng hợp. Deadline: submit Play Store trước 26/03/2026 (2 ngày).

## Stakeholders
- Primary user: Người chơi xổ số Vietlott, thường tập trung 1-2 game yêu thích, không cần xem tất cả cùng lúc
- Affected systems: scraper.ts (thêm 4 game), database.ts (thêm 4 bảng), statistics.ts (adjust cho 5/35, 3D), navigation (mới), HomeScreen (redesign thành trang chủ)

## User Stories

US-1: As a user, I want to see latest results of all 5 games on the home screen so that I get a quick overview without navigating
  AC-1.1: GIVEN app opens WHEN data is loaded THEN home screen shows latest draw result for each of 5 games (numbers, date, draw ID)
  AC-1.2: GIVEN no network WHEN app opens THEN home screen shows cached results from SQLite with "offline" indicator
  AC-1.3: GIVEN a game result is tapped WHEN on home screen THEN navigate to that game's detail screen

US-2: As a user, I want to view detailed results and history for each game on its own screen so that I can focus on the game I play
  AC-2.1: GIVEN I navigate to Power 6/55 screen WHEN data exists THEN I see draw history with 6 numbers per draw, sorted by date desc
  AC-2.2: GIVEN I navigate to Lotto 5/35 screen WHEN data exists THEN I see draw history with 5 numbers per draw
  AC-2.3: GIVEN I navigate to Max 3D screen WHEN data exists THEN I see Max 3D + Max 3D Pro results combined on one screen
  AC-2.4: GIVEN network error WHEN fetching new results THEN show Alert with error message, keep showing cached data

US-3: As a user, I want frequency analysis, absent number tracking, and AI suggestions for each game separately so that I can make informed choices
  AC-3.1: GIVEN I'm on a game's statistics screen WHEN stats are calculated THEN frequency chart shows correct number range (1-45, 1-55, 1-35, or 0-9 for 3D)
  AC-3.2: GIVEN I'm on statistics screen WHEN I'm a free user THEN show limited stats + upgrade prompt
  AC-3.3: GIVEN I'm a premium user WHEN viewing any game's statistics THEN full stats + AI suggestions are unlocked for ALL games

US-4: As a user, I want the app to scrape history for all 5 games on first launch so that all data is ready when I navigate
  AC-4.1: GIVEN first launch WHEN scraping starts THEN all 5 games scrape concurrently with progress indicator
  AC-4.2: GIVEN scrape in progress WHEN one game fails THEN other games continue, failed game shows retry option
  AC-4.3: GIVEN subsequent launches WHEN checking for new results THEN fetch only new draws since last stored draw per game

US-5: As a user, I want to navigate between games using a clear multi-screen layout with a home page
  AC-5.1: GIVEN app is open WHEN I see navigation THEN I can access: Home, Mega 6/45, Power 6/55, Lotto 5/35, Max 3D, and Statistics
  AC-5.2: GIVEN I switch between screens WHEN navigating THEN transition is smooth with no data reload flicker

## Scope

### In Scope
- 5 games: Mega 6/45, Power 6/55, Lotto 5/35, Max 3D, Max 3D Pro (gộp 1 màn hình)
- Home screen: latest results overview cho tất cả 5 game
- Per-game detail screens: draw history, jackpot info
- Per-game statistics screens: frequency, absent numbers, AI suggestions (premium)
- Navigation: multi-screen with tab/drawer (agent discretion on library choice)
- Database: 1 bảng riêng cho mỗi game (5 bảng total)
- Scraper: mở rộng cho 4 game mới (reuse API pattern từ 6/45)
- Statistics: adjust algorithms cho 5/35 (5 numbers, range 1-35) và 3D (3 digits, range 0-9)
- Ads: shared banner + interstitial across all screens
- Premium: unlock all games at once
- Offline: cached results viewable for all games

### Out of Scope
- Keno (quay mỗi 8 phút — quá nhiều data)
- BINGO18 (cơ chế khác hoàn toàn)
- Push notifications kết quả mới
- Dò số tự động
- Per-game premium unlock (premium = all games)
- User account / cloud sync

### Assumptions
- Vietlott API pattern (AjaxPro) giống nhau cho tất cả game (chỉ khác WebPart class name) — RỦI RO nếu sai
- Max 3D và Max 3D Pro share cùng endpoint hoặc endpoint tương tự — cần verify
- Statistics algorithms cho 6/45 có thể adapt cho 6/55 (cùng format, khác range) — LOW RISK
- Statistics cho Max 3D cần logic mới (3 digits 0-9, không phải 6 numbers) — MEDIUM RISK

## Non-Functional Requirements

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| Performance | Home screen load < 2s (cached data), initial scrape all games < 60s | Manual test on mid-range Android |
| Performance | Navigation between screens < 300ms | No loading spinner on screen switch |
| Data | SQLite storage for 5 games, ~5000 draws total | DB size < 5MB |
| Reliability | One game scrape failure doesn't block others | Error isolation per game |

## Dependencies
- Vietlott AjaxPro API: available (verified for 6/45, need to verify endpoints for 4 other games)
- Navigation library: needs setup (React Navigation recommended — mature, Expo compatible)
- expo-sqlite: already in use, supports multiple tables
- react-native-google-mobile-ads: already configured
- react-native-iap: already configured

## Risks
- **API endpoint discovery (HIGH)**: Need to find correct WebPart class names for Power 6/55, Lotto 5/35, Max 3D. Mitigation: scrape each game's page to extract endpoint.
- **Tight deadline — 5 days (HIGH)**: 5 games + navigation + new screens. Mitigation: reuse existing components, prioritize 6/55 and 5/35 first (similar to 6/45), Max 3D last.
- **Max 3D statistics logic (MEDIUM)**: Completely different number format (3 digits vs 6 numbers). Mitigation: start with basic results display, add statistics as time allows.
- **App size increase (LOW)**: More screens + navigation library. Mitigation: code splitting, lazy loading screens.

## Decision Classification

| Category | Decision |
|----------|----------|
| **Decisions** (locked) | 5 games only (no Keno, no BINGO18) |
| **Decisions** (locked) | Max 3D + Max 3D Pro gộp 1 màn hình |
| **Decisions** (locked) | Database: bảng riêng cho mỗi game |
| **Decisions** (locked) | Premium: unlock all games |
| **Decisions** (locked) | Ads: shared across screens |
| **Decisions** (locked) | Multi-screen with home page |
| **Decisions** (locked) | Scrape all 5 games on first launch |
| **Decisions** (locked) | Statistics/AI: trang riêng, tách từng game |
| **Discretion** (agent) | Navigation library choice |
| **Discretion** (agent) | Navigation pattern (tab bar vs drawer) |
| **Discretion** (agent) | Screen layout / component structure |
| **Deferred** | Push notifications |
| **Deferred** | Dò số tự động |
| **Deferred** | User account / cloud sync |

## Next Step
-> Hand off to rune:plan for implementation planning
