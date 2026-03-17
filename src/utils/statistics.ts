import { DrawRow } from '../database/database';

export interface NumberStats {
  label: string;
  freq: number;
  absent: number;
}

export function calculateStats(draws: DrawRow[]): NumberStats[] {
  // Count frequency
  const counter: Record<number, number> = {};
  for (const draw of draws) {
    for (const num of [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6]) {
      counter[num] = (counter[num] || 0) + 1;
    }
  }

  // Calculate absence (draws since last seen)
  const lastSeen: Record<number, number> = {};
  draws.forEach((draw, i) => {
    for (const num of [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6]) {
      if (!(num in lastSeen)) {
        lastSeen[num] = i;
      }
    }
  });

  const total = draws.length;
  const result: NumberStats[] = [];
  for (let n = 1; n <= 45; n++) {
    result.push({
      label: String(n).padStart(2, '0'),
      freq: counter[n] || 0,
      absent: n in lastSeen ? lastSeen[n] : total,
    });
  }
  return result;
}

export interface SuggestedSet {
  numbers: string[];
  cold: string;
}

export function generateSuggestions(
  draws: DrawRow[],
  absentData: { number: string; absent_draws: number }[]
): SuggestedSet[] {
  if (draws.length === 0) return [];

  const counter: Record<number, number> = {};
  for (const draw of draws) {
    for (const num of [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6]) {
      counter[num] = (counter[num] || 0) + 1;
    }
  }

  // Sort by frequency desc
  const sortedNums = Array.from({ length: 45 }, (_, i) => i + 1).sort(
    (a, b) => (counter[b] || 0) - (counter[a] || 0)
  );
  const top10 = sortedNums.slice(0, 10);
  const rest = sortedNums.slice(10);
  const absentNums = absentData.map((item) => parseInt(item.number, 10));

  const sets: SuggestedSet[] = [];
  for (let i = 0; i < 5; i++) {
    // Pick 5 from top10 using weighted random
    const available = [...top10];
    const hotPicks: number[] = [];
    for (let j = 0; j < 5; j++) {
      const weights = available.map((n) => (counter[n] || 0) + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let chosenIdx = 0;
      for (let k = 0; k < weights.length; k++) {
        rand -= weights[k];
        if (rand <= 0) {
          chosenIdx = k;
          break;
        }
      }
      hotPicks.push(available[chosenIdx]);
      available.splice(chosenIdx, 1);
    }

    // Cold pick
    let coldPick: number;
    if (i >= 3 && absentNums.length > 0) {
      const candidates = absentNums.filter((n) => !hotPicks.includes(n));
      coldPick =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : rest[Math.floor(Math.random() * rest.length)];
    } else {
      coldPick = rest[Math.floor(Math.random() * rest.length)];
    }

    const numbers = [...hotPicks, coldPick].sort((a, b) => a - b);
    sets.push({
      numbers: numbers.map((n) => String(n).padStart(2, '0')),
      cold: String(coldPick).padStart(2, '0'),
    });
  }
  return sets;
}
