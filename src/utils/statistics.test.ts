import { calculateStats, generateSuggestions } from './statistics';
import type { DrawRow } from '../database/database';

// Helper to create a DrawRow
function makeDraw(num: string, date: string, numbers: number[], special?: number): DrawRow {
  return {
    id: parseInt(num, 10),
    draw_number: num,
    draw_date: date,
    numbers,
    special_number: special,
  };
}

describe('calculateStats', () => {
  it('returns correct frequency count for mega645', () => {
    const draws: DrawRow[] = [
      makeDraw('001', '2026-03-01', [1, 2, 3, 4, 5, 6]),
      makeDraw('002', '2026-03-03', [1, 2, 7, 8, 9, 10]),
      makeDraw('003', '2026-03-05', [1, 11, 12, 13, 14, 15]),
    ];
    const stats = calculateStats(draws, 'mega645');

    // Number 1 appears in all 3 draws
    const num1 = stats.find(s => s.label === '01');
    expect(num1).toBeDefined();
    expect(num1!.freq).toBe(3);

    // Number 2 appears in 2 draws
    const num2 = stats.find(s => s.label === '02');
    expect(num2!.freq).toBe(2);

    // Number 45 never appears
    const num45 = stats.find(s => s.label === '45');
    expect(num45!.freq).toBe(0);
  });

  it('returns correct absent count (draws since last seen)', () => {
    const draws: DrawRow[] = [
      makeDraw('003', '2026-03-05', [10, 20, 30, 40, 41, 42]),  // index 0 (most recent)
      makeDraw('002', '2026-03-03', [1, 2, 3, 4, 5, 6]),        // index 1
      makeDraw('001', '2026-03-01', [7, 8, 9, 10, 11, 12]),     // index 2
    ];
    const stats = calculateStats(draws, 'mega645');

    // Number 10: last seen at index 0 (most recent draw)
    expect(stats.find(s => s.label === '10')!.absent).toBe(0);

    // Number 1: last seen at index 1
    expect(stats.find(s => s.label === '01')!.absent).toBe(1);

    // Number 7: last seen at index 2
    expect(stats.find(s => s.label === '07')!.absent).toBe(2);

    // Number 45: never seen → absent = total draws
    expect(stats.find(s => s.label === '45')!.absent).toBe(3);
  });

  it('returns 45 entries for mega645', () => {
    const stats = calculateStats([], 'mega645');
    expect(stats).toHaveLength(45);
    expect(stats[0].label).toBe('01');
    expect(stats[44].label).toBe('45');
  });

  it('returns 55 entries for power655', () => {
    const stats = calculateStats([], 'power655');
    expect(stats).toHaveLength(55);
    expect(stats[0].label).toBe('01');
    expect(stats[54].label).toBe('55');
  });

  it('returns 35 entries for lotto535', () => {
    const stats = calculateStats([], 'lotto535');
    expect(stats).toHaveLength(35);
  });

  it('returns 1000 entries for max3d (0-999) with 3-digit padding', () => {
    const stats = calculateStats([], 'max3d');
    expect(stats).toHaveLength(1000);
    expect(stats[0].label).toBe('000');
    expect(stats[999].label).toBe('999');
  });

  it('handles empty draws array', () => {
    const stats = calculateStats([], 'mega645');
    expect(stats).toHaveLength(45);
    stats.forEach(s => {
      expect(s.freq).toBe(0);
      expect(s.absent).toBe(0); // total draws = 0
    });
  });
});

describe('generateSuggestions', () => {
  const sampleDraws: DrawRow[] = Array.from({ length: 30 }, (_, i) =>
    makeDraw(
      String(i + 1).padStart(5, '0'),
      `2026-03-${String(i + 1).padStart(2, '0')}`,
      [
        (i % 45) + 1,
        ((i + 1) % 45) + 1,
        ((i + 2) % 45) + 1,
        ((i + 3) % 45) + 1,
        ((i + 4) % 45) + 1,
        ((i + 5) % 45) + 1,
      ]
    )
  );

  const sampleAbsent = [
    { number: '40', absent_draws: 20 },
    { number: '41', absent_draws: 18 },
    { number: '42', absent_draws: 15 },
  ];

  it('returns requested number of suggestion sets for mega645', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 3,
      gameId: 'mega645',
    });
    expect(sets.length).toBeLessThanOrEqual(3);
    expect(sets.length).toBeGreaterThan(0);
  });

  it('each set has exactly 6 numbers for mega645', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      gameId: 'mega645',
    });
    for (const set of sets) {
      expect(set.numbers).toHaveLength(6);
    }
  });

  it('each set has exactly 5 numbers for lotto535', () => {
    const draws535 = Array.from({ length: 20 }, (_, i) =>
      makeDraw(
        String(i + 1).padStart(5, '0'),
        `2026-03-${String(i + 1).padStart(2, '0')}`,
        [(i % 35) + 1, ((i + 1) % 35) + 1, ((i + 2) % 35) + 1, ((i + 3) % 35) + 1, ((i + 4) % 35) + 1]
      )
    );
    const sets = generateSuggestions(draws535, sampleAbsent, {
      count: 3,
      gameId: 'lotto535',
    });
    for (const set of sets) {
      expect(set.numbers).toHaveLength(5);
    }
  });

  it('numbers are sorted ascending', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      gameId: 'mega645',
    });
    for (const set of sets) {
      const nums = set.numbers.map(n => parseInt(n, 10));
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
      }
    }
  });

  it('numbers are 2-digit padded strings', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 3,
      gameId: 'mega645',
    });
    for (const set of sets) {
      for (const num of set.numbers) {
        expect(num).toMatch(/^\d{2}$/);
      }
    }
  });

  it('returns empty array for max3d games', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      gameId: 'max3d',
    });
    expect(sets).toEqual([]);
  });

  it('returns empty array for max3d_pro games', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      gameId: 'max3d_pro',
    });
    expect(sets).toEqual([]);
  });

  it('returns empty for empty draws', () => {
    const sets = generateSuggestions([], sampleAbsent, {
      count: 5,
      gameId: 'mega645',
    });
    expect(sets).toEqual([]);
  });

  it('premium advanced mode returns strategy names', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      advanced: true,
      gameId: 'mega645',
    });
    for (const set of sets) {
      expect(set.strategy).toBeDefined();
      expect(typeof set.strategy).toBe('string');
    }
  });

  it('each set has a cold number', () => {
    const sets = generateSuggestions(sampleDraws, sampleAbsent, {
      count: 5,
      gameId: 'mega645',
    });
    for (const set of sets) {
      expect(set.cold).toBeDefined();
      expect(set.cold).toMatch(/^\d{2}$/);
      expect(set.numbers).toContain(set.cold);
    }
  });
});
