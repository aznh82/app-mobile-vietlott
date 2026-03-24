import * as SQLite from 'expo-sqlite';
import { GameId, GAME_CONFIGS, ALL_GAME_IDS } from '../types/game';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('vietlott.db');
  }
  return dbPromise;
}

function tableName(gameId: GameId): string {
  return GAME_CONFIGS[gameId].tableName;
}

export async function initDB(): Promise<void> {
  const database = await getDatabase();

  // Migration: if old `draws` table exists (n1-n6 columns), migrate to draws_645
  try {
    const oldTable = await database.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='draws'"
    );
    if (oldTable) {
      // Create draws_645 with new schema
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS draws_645 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          draw_number TEXT UNIQUE NOT NULL,
          draw_date TEXT NOT NULL,
          numbers TEXT NOT NULL,
          special_number INTEGER
        );
      `);
      // Migrate data: convert n1-n6 columns to JSON array
      const oldRows = await database.getAllAsync<{
        draw_number: string; draw_date: string;
        n1: number; n2: number; n3: number; n4: number; n5: number; n6: number;
      }>('SELECT * FROM draws');
      for (const row of oldRows) {
        const nums = [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6];
        try {
          await database.runAsync(
            'INSERT INTO draws_645 (draw_number, draw_date, numbers) VALUES (?, ?, ?)',
            [row.draw_number, row.draw_date, JSON.stringify(nums)]
          );
        } catch {
          // Skip duplicates during migration
        }
      }
      // Drop old table after successful migration
      await database.execAsync('DROP TABLE draws');
      console.warn(`Migration complete: ${oldRows.length} draws → draws_645`);
    }
  } catch (e: any) {
    console.warn('Migration check failed (non-fatal):', e?.message);
  }

  // Create all 5 game tables
  for (const gameId of ALL_GAME_IDS) {
    const tbl = tableName(gameId);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS ${tbl} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        draw_number TEXT UNIQUE NOT NULL,
        draw_date TEXT NOT NULL,
        numbers TEXT NOT NULL,
        special_number INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_${tbl}_date ON ${tbl}(draw_date);
      CREATE INDEX IF NOT EXISTS idx_${tbl}_number ON ${tbl}(draw_number);
    `);
  }
}

export interface DrawRow {
  id: number;
  draw_number: string;
  draw_date: string;
  numbers: number[];
  special_number?: number;
}

interface RawDrawRow {
  id: number;
  draw_number: string;
  draw_date: string;
  numbers: string;
  special_number: number | null;
}

function parseRow(raw: RawDrawRow): DrawRow {
  return {
    id: raw.id,
    draw_number: raw.draw_number,
    draw_date: raw.draw_date,
    numbers: JSON.parse(raw.numbers),
    special_number: raw.special_number ?? undefined,
  };
}

export async function saveDraws(
  gameId: GameId,
  draws: [string, string, number[], number?][]
): Promise<number> {
  const database = await getDatabase();
  const tbl = tableName(gameId);
  let inserted = 0;
  for (const [drawNumber, drawDate, numbers, specialNum] of draws) {
    try {
      await database.runAsync(
        `INSERT INTO ${tbl} (draw_number, draw_date, numbers, special_number) VALUES (?, ?, ?, ?)`,
        [drawNumber, drawDate, JSON.stringify(numbers), specialNum ?? null]
      );
      inserted++;
    } catch (e: any) {
      const msg = e?.message || '';
      if (!msg.includes('UNIQUE') && !msg.includes('constraint')) {
        console.warn(`saveDraws(${gameId}) unexpected error:`, msg);
      }
    }
  }
  return inserted;
}

export async function getLatestDraw(gameId: GameId): Promise<string | null> {
  const database = await getDatabase();
  const tbl = tableName(gameId);
  const row = await database.getFirstAsync<{ draw_number: string }>(
    `SELECT draw_number FROM ${tbl} ORDER BY draw_number DESC LIMIT 1`
  );
  return row?.draw_number ?? null;
}

export async function getDrawsByPeriod(gameId: GameId, period: string): Promise<DrawRow[]> {
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
  const tbl = tableName(gameId);
  const rows = await database.getAllAsync<RawDrawRow>(
    `SELECT * FROM ${tbl} WHERE draw_date >= ? ORDER BY draw_date DESC`,
    [cutoffStr]
  );
  return rows.map(parseRow);
}

export async function getTotalDraws(gameId: GameId): Promise<number> {
  const database = await getDatabase();
  const tbl = tableName(gameId);
  const row = await database.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM ${tbl}`
  );
  return row?.cnt ?? 0;
}

export async function getLatestDrawFull(gameId: GameId): Promise<DrawRow | null> {
  const database = await getDatabase();
  const tbl = tableName(gameId);
  const row = await database.getFirstAsync<RawDrawRow>(
    `SELECT * FROM ${tbl} ORDER BY draw_number DESC LIMIT 1`
  );
  if (!row) return null;
  return parseRow(row);
}

export async function getLongestAbsent(
  gameId: GameId,
  limit = 10
): Promise<{ number: string; absent_draws: number }[]> {
  const config = GAME_CONFIGS[gameId];
  const database = await getDatabase();
  const tbl = tableName(gameId);

  const allDraws = await database.getAllAsync<RawDrawRow>(
    `SELECT draw_number, numbers FROM ${tbl} ORDER BY draw_number DESC LIMIT 156`
  );
  if (allDraws.length === 0) return [];

  const lastSeen: Record<number, number> = {};
  allDraws.forEach((raw, i) => {
    const nums: number[] = JSON.parse(raw.numbers);
    for (const num of nums) {
      if (!(num in lastSeen)) {
        lastSeen[num] = i;
      }
    }
  });

  const total = allDraws.length;
  const result: { number: string; absent_draws: number }[] = [];
  const padLen = config.maxNumber >= 100 ? 3 : 2;
  for (let n = config.minNumber; n <= config.maxNumber; n++) {
    const absent = n in lastSeen ? lastSeen[n] : total;
    result.push({
      number: String(n).padStart(padLen, '0'),
      absent_draws: absent,
    });
  }

  result.sort((a, b) => b.absent_draws - a.absent_draws);
  return result.slice(0, limit);
}

export async function cleanupOldData(gameId: GameId): Promise<number> {
  const database = await getDatabase();
  const tbl = tableName(gameId);
  const cutoff = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const result = await database.runAsync(
    `DELETE FROM ${tbl} WHERE draw_date < ?`,
    [cutoff]
  );
  return result.changes;
}
