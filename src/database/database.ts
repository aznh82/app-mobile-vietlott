import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('vietlott.db');
  }
  return db;
}

export async function initDB(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_number TEXT UNIQUE NOT NULL,
      draw_date TEXT NOT NULL,
      n1 INTEGER NOT NULL,
      n2 INTEGER NOT NULL,
      n3 INTEGER NOT NULL,
      n4 INTEGER NOT NULL,
      n5 INTEGER NOT NULL,
      n6 INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_draw_date ON draws(draw_date);
    CREATE INDEX IF NOT EXISTS idx_draw_number ON draws(draw_number);
  `);
}

export interface DrawRow {
  id: number;
  draw_number: string;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
}

export async function saveDraws(
  draws: [string, string, number[]][]
): Promise<number> {
  const database = await getDatabase();
  let inserted = 0;
  for (const [drawNumber, drawDate, numbers] of draws) {
    try {
      await database.runAsync(
        'INSERT INTO draws (draw_number, draw_date, n1, n2, n3, n4, n5, n6) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [drawNumber, drawDate, ...numbers]
      );
      inserted++;
    } catch {
      // IntegrityError - draw already exists
    }
  }
  return inserted;
}

export async function getLatestDraw(): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ draw_number: string }>(
    'SELECT draw_number FROM draws ORDER BY draw_number DESC LIMIT 1'
  );
  return row?.draw_number ?? null;
}

export async function getDrawsByPeriod(period: string): Promise<DrawRow[]> {
  const now = new Date();
  let daysBack: number;
  switch (period) {
    case '15d': daysBack = 15; break;
    case '30d': daysBack = 30; break;
    case '3m': daysBack = 90; break;
    case '6m': daysBack = 180; break;
    default: daysBack = 15;
  }
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const database = await getDatabase();
  return database.getAllAsync<DrawRow>(
    'SELECT * FROM draws WHERE draw_date >= ? ORDER BY draw_date DESC',
    [cutoffStr]
  );
}

export async function getTotalDraws(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM draws'
  );
  return row?.cnt ?? 0;
}

export async function getLatestDrawFull(): Promise<{
  draw_number: string;
  draw_date: string;
  numbers: string[];
} | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<DrawRow>(
    'SELECT * FROM draws ORDER BY draw_number DESC LIMIT 1'
  );
  if (!row) return null;
  const nums = [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].sort((a, b) => a - b);
  return {
    draw_number: row.draw_number,
    draw_date: row.draw_date,
    numbers: nums.map((n) => String(n).padStart(2, '0')),
  };
}

export async function getLongestAbsent(
  limit = 10
): Promise<{ number: string; absent_draws: number }[]> {
  const database = await getDatabase();
  // Lấy tối đa 156 kỳ gần nhất (tương đương ~1 năm mở thưởng, 3 kỳ/tuần)
  const allDraws = await database.getAllAsync<DrawRow>(
    'SELECT draw_number, n1, n2, n3, n4, n5, n6 FROM draws ORDER BY draw_number DESC LIMIT 156'
  );

  if (allDraws.length === 0) return [];

  const lastSeen: Record<number, number> = {};
  allDraws.forEach((draw, i) => {
    for (const num of [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6]) {
      if (!(num in lastSeen)) {
        lastSeen[num] = i;
      }
    }
  });

  const total = allDraws.length;
  const result: { number: string; absent_draws: number }[] = [];
  for (let n = 1; n <= 45; n++) {
    const absent = n in lastSeen ? lastSeen[n] : total;
    result.push({ number: String(n).padStart(2, '0'), absent_draws: absent });
  }

  result.sort((a, b) => b.absent_draws - a.absent_draws);
  return result.slice(0, limit);
}

export async function cleanupOldData(): Promise<number> {
  const database = await getDatabase();
  // Giữ 400 ngày thay vì 365 để buffer cho absent data (156 kỳ)
  const cutoff = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const result = await database.runAsync(
    'DELETE FROM draws WHERE draw_date < ?',
    [cutoff]
  );
  return result.changes;
}
