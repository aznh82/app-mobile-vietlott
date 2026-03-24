import type { DrawRow } from '../database/database';
import { GAME_CONFIGS } from '../types/game';
import type { GameId } from '../types/game';

export interface NumberStats {
  label: string;
  freq: number;
  absent: number;
}

export function calculateStats(draws: DrawRow[], gameId: GameId = 'mega645'): NumberStats[] {
  const config = GAME_CONFIGS[gameId];
  const counter: Record<number, number> = {};
  for (const draw of draws) {
    for (const num of draw.numbers) {
      counter[num] = (counter[num] || 0) + 1;
    }
  }

  const lastSeen: Record<number, number> = {};
  draws.forEach((draw, i) => {
    for (const num of draw.numbers) {
      if (!(num in lastSeen)) {
        lastSeen[num] = i;
      }
    }
  });

  const total = draws.length;
  const padLen = config.maxNumber >= 100 ? 3 : 2;
  const result: NumberStats[] = [];
  for (let n = config.minNumber; n <= config.maxNumber; n++) {
    result.push({
      label: String(n).padStart(padLen, '0'),
      freq: counter[n] || 0,
      absent: n in lastSeen ? lastSeen[n] : total,
    });
  }
  return result;
}

export interface SuggestedSet {
  numbers: string[];
  cold: string;
  strategy?: string; // chỉ hiện cho premium
}

// Strategies cho premium
const STRATEGIES = [
  { name: 'Nóng tập trung', hotCount: 5, warmCount: 0, coldCount: 1 },
  { name: 'Xu hướng tăng', hotCount: 4, warmCount: 1, coldCount: 1 },
  { name: 'Cân bằng', hotCount: 3, warmCount: 2, coldCount: 1 },
  { name: 'Phục hồi lạnh', hotCount: 3, warmCount: 1, coldCount: 2 },
  { name: 'Đa dạng', hotCount: 2, warmCount: 3, coldCount: 1 },
];

function weightedPick(
  pool: number[],
  weights: number[],
  count: number
): number[] {
  const available = [...pool];
  const availWeights = [...weights];
  const picks: number[] = [];

  for (let j = 0; j < count && available.length > 0; j++) {
    const totalWeight = availWeights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let chosenIdx = 0;
    for (let k = 0; k < availWeights.length; k++) {
      rand -= availWeights[k];
      if (rand <= 0) {
        chosenIdx = k;
        break;
      }
    }
    picks.push(available[chosenIdx]);
    available.splice(chosenIdx, 1);
    availWeights.splice(chosenIdx, 1);
  }
  return picks;
}

interface SuggestionOptions {
  count?: number;
  advanced?: boolean;
  gameId?: GameId;
}

export function generateSuggestions(
  draws: DrawRow[],
  absentData: { number: string; absent_draws: number }[],
  options?: SuggestionOptions
): SuggestedSet[] {
  const resolvedGameId: GameId = options?.gameId ?? 'mega645';

  // Max 3D games do not support suggestions
  if (resolvedGameId === 'max3d' || resolvedGameId === 'max3d_pro') {
    return [];
  }

  const config = GAME_CONFIGS[resolvedGameId];
  const pickCount = config.numberCount;
  const maxNum = config.maxNumber;

  const count = options?.count ?? 5;
  const advanced = options?.advanced ?? false;

  if (draws.length === 0) return [];

  const counter: Record<number, number> = {};
  for (const draw of draws) {
    for (const num of draw.numbers) {
      counter[num] = (counter[num] || 0) + 1;
    }
  }

  const sortedNums = Array.from({ length: maxNum }, (_, i) => i + 1).sort(
    (a, b) => (counter[b] || 0) - (counter[a] || 0)
  );

  const absentNums = absentData.map((item) => parseInt(item.number, 10));

  if (!advanced) {
    // === FREE TIER: basic algorithm ===
    const top10 = sortedNums.slice(0, 10);
    const rest = sortedNums.slice(10);
    const sets: SuggestedSet[] = [];

    for (let i = 0; i < count; i++) {
      const hotPicks = weightedPick(
        top10,
        top10.map((n) => (counter[n] || 0) + 1),
        pickCount - 1
      );

      let coldPick: number;
      if (i >= 2 && absentNums.length > 0) {
        const candidates = absentNums.filter((n) => !hotPicks.includes(n));
        coldPick = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : rest[Math.floor(Math.random() * rest.length)];
      } else {
        coldPick = rest[Math.floor(Math.random() * rest.length)];
      }

      const numbers = [...hotPicks, coldPick].sort((a, b) => a - b);
      if (numbers.length === pickCount) {
        sets.push({
          numbers: numbers.map((n) => String(n).padStart(2, '0')),
          cold: String(coldPick).padStart(2, '0'),
        });
      }
    }
    return sets;
  }

  // === PREMIUM TIER: advanced algorithm (multiple strategies) ===
  const top15 = sortedNums.slice(0, 15);
  const warm = sortedNums.slice(10, 25);
  const coldPool = sortedNums.slice(25);
  const sets: SuggestedSet[] = [];

  for (let i = 0; i < count; i++) {
    const strategy = STRATEGIES[i % STRATEGIES.length];
    const allPicks: number[] = [];

    // Hot picks
    const hotPicks = weightedPick(
      top15,
      top15.map((n) => (counter[n] || 0) + 1),
      strategy.hotCount
    );
    allPicks.push(...hotPicks);

    // Warm picks
    if (strategy.warmCount > 0) {
      const warmAvailable = warm.filter((n) => !allPicks.includes(n));
      const warmPicks = weightedPick(
        warmAvailable,
        warmAvailable.map((n) => (counter[n] || 0) + 1),
        strategy.warmCount
      );
      allPicks.push(...warmPicks);
    }

    // Cold picks
    for (let c = 0; c < strategy.coldCount; c++) {
      if (absentNums.length > 0) {
        const candidates = absentNums.filter((n) => !allPicks.includes(n));
        if (candidates.length > 0) {
          allPicks.push(candidates[Math.floor(Math.random() * candidates.length)]);
          continue;
        }
      }
      const coldAvailable = coldPool.filter((n) => !allPicks.includes(n));
      if (coldAvailable.length > 0) {
        allPicks.push(coldAvailable[Math.floor(Math.random() * coldAvailable.length)]);
      }
    }

    if (allPicks.length < pickCount) continue;
    const coldNum = allPicks[allPicks.length - 1];
    const numbers = [...allPicks].sort((a, b) => a - b);

    sets.push({
      numbers: numbers.map((n) => String(n).padStart(2, '0')),
      cold: String(coldNum).padStart(2, '0'),
      strategy: strategy.name,
    });
  }

  return sets;
}
