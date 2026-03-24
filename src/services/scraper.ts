import { GameId, GameConfig, GAME_CONFIGS, ALL_GAME_IDS } from '../types/game';
import { saveDraws, getLatestDraw } from '../database/database';

const BASE_URL = 'https://www.vietlott.vn';
const RENDER_INFO_URL = `${BASE_URL}/ajaxpro/Vietlott.Utility.WebEnvironments,Vietlott.Utility.ashx`;
const MAX_PAGES = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getAjaxUrl(config: GameConfig): string {
  return `${BASE_URL}/ajaxpro/Vietlott.PlugIn.WebParts.${config.webPartClass},Vietlott.PlugIn.WebParts.ashx`;
}

function getPageUrl(config: GameConfig): string {
  return `${BASE_URL}${config.pageUrl}`;
}

// === Shared functions ===

async function getApiKey(config: GameConfig): Promise<string> {
  const resp = await fetch(getPageUrl(config));
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  const match = text.match(/ServerSideDrawResult\(RenderInfo,\s*'([a-f0-9]+)'/);
  if (!match) throw new Error(`Could not extract API key from ${config.shortName} page`);
  return match[1];
}

async function getRenderInfo(): Promise<any> {
  const resp = await fetch(RENDER_INFO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AjaxPro-Method': 'ServerSideFrontEndCreateRenderInfo',
    },
    body: JSON.stringify({ SiteId: 'main.frontend.vi' }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const renderInfo = data.value;
  renderInfo.SiteLang = 'vi';
  return renderInfo;
}

function getEmptyNumbers(config: GameConfig): string[][] {
  const count = config.id.startsWith('max3d') ? 1 : 6;
  return Array(count).fill(Array(18).fill(''));
}

async function fetchPage(
  config: GameConfig,
  key: string,
  renderInfo: any,
  pageIndex: number
): Promise<any> {
  const payload = {
    ORenderInfo: renderInfo,
    Key: key,
    GameDrawId: '',
    ArrayNumbers: getEmptyNumbers(config),
    CheckMulti: false,
    PageIndex: pageIndex,
  };
  const resp = await fetch(getAjaxUrl(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AjaxPro-Method': 'ServerSideDrawResult',
      Referer: getPageUrl(config),
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const value = data.value || {};
  if (value.Error) throw new Error(`API error: ${value.InfoMessage}`);
  return value;
}

// === Parse functions per game type ===

type DrawTuple = [string, string, number[], number?];

function parseLotteryResults(
  html: string,
  config: GameConfig
): DrawTuple[] {
  const results: DrawTuple[] = [];
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return results;

  const tbody = tbodyMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 3) continue;

    const dateStr = stripTags(tds[0]);
    const linkMatch = tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const drawNumber = stripTags(linkMatch[1]);

    // Numbers from bong_tron spans
    const spanRegex = /<span[^>]*class="[^"]*bong_tron[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const numbers: number[] = [];
    let spanMatch: RegExpExecArray | null;
    while ((spanMatch = spanRegex.exec(tds[2])) !== null) {
      const num = parseInt(stripTags(spanMatch[1]), 10);
      if (!isNaN(num)) numbers.push(num);
    }

    // For 5/35: first 5 are main, 6th is special
    let mainNumbers: number[];
    let specialNumber: number | undefined;

    if (config.id === 'lotto535' && numbers.length >= 6) {
      mainNumbers = numbers.slice(0, 5);
      specialNumber = numbers[5];
    } else if (numbers.length >= config.numberCount) {
      mainNumbers = numbers.slice(0, config.numberCount);
      // For 6/55: if extra number exists, it's the power number
      if (config.hasSpecialNumber && numbers.length > config.numberCount) {
        specialNumber = numbers[config.numberCount];
      }
    } else {
      continue; // skip rows with wrong number count
    }

    // Convert dd/mm/yyyy to yyyy-mm-dd
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const dateIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
    results.push([drawNumber, dateIso, mainNumbers, specialNumber]);
  }

  return results;
}

function parseMax3DResults(
  responseValue: any
): DrawTuple[] {
  const results: DrawTuple[] = [];
  const html = responseValue.HtmlContent || '';

  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return results;

  const tbody = tbodyMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 3) continue;

    const dateStr = stripTags(tds[0]);
    const linkMatch = tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const drawNumber = stripTags(linkMatch[1]);

    // Extract all 3-digit numbers from the remaining tds
    const numbers: number[] = [];
    for (let i = 2; i < tds.length; i++) {
      const numRegex = /\b(\d{3})\b/g;
      let numMatch: RegExpExecArray | null;
      while ((numMatch = numRegex.exec(stripTags(tds[i]))) !== null) {
        numbers.push(parseInt(numMatch[1], 10));
      }
    }

    if (numbers.length === 0) continue;

    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const dateIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
    results.push([drawNumber, dateIso, numbers]);
  }

  return results;
}

function parseResults(
  gameId: GameId,
  responseValue: any,
  config: GameConfig
): DrawTuple[] {
  if (gameId === 'max3d' || gameId === 'max3d_pro') {
    return parseMax3DResults(responseValue);
  }
  return parseLotteryResults(responseValue.HtmlContent || '', config);
}

// === Public API ===

export async function fetchAllFrom(
  gameId: GameId,
  startDraw?: string,
  onProgress?: (page: number, count: number) => void
): Promise<DrawTuple[]> {
  const config = GAME_CONFIGS[gameId];
  const key = await getApiKey(config);
  const renderInfo = await getRenderInfo();
  const allResults: DrawTuple[] = [];
  let page = 0;

  while (page < MAX_PAGES) {
    let value: any;
    try {
      value = await fetchPage(config, key, renderInfo, page);
    } catch (e) {
      if (page > 0) {
        try {
          const newKey = await getApiKey(config);
          value = await fetchPage(config, newKey, renderInfo, page);
        } catch { break; }
      } else {
        throw e;
      }
    }

    const results = parseResults(gameId, value, config);
    if (results.length === 0) break;

    if (startDraw) {
      let reachedStart = false;
      const startPadded = startDraw.padStart(5, '0');
      for (const r of results) {
        const drawNum = r[0].padStart(5, '0');
        if (drawNum >= startPadded) {
          allResults.push(r);
        }
        if (drawNum <= startPadded) {
          reachedStart = true;
          break;
        }
      }
      if (reachedStart) break;
    } else {
      allResults.push(...results);
    }

    onProgress?.(page, allResults.length);
    page++;
    await delay(300);
  }

  return allResults;
}

export async function fetchNew(
  gameId: GameId,
  latestDraw: string
): Promise<DrawTuple[]> {
  const config = GAME_CONFIGS[gameId];
  const key = await getApiKey(config);
  const renderInfo = await getRenderInfo();
  const newResults: DrawTuple[] = [];
  let page = 0;

  while (page < MAX_PAGES) {
    let value: any;
    try {
      value = await fetchPage(config, key, renderInfo, page);
    } catch (e) {
      if (page > 0) {
        try {
          const newKey = await getApiKey(config);
          value = await fetchPage(config, newKey, renderInfo, page);
        } catch { break; }
      } else {
        throw e;
      }
    }

    const results = parseResults(gameId, value, config);
    if (results.length === 0) break;

    let foundExisting = false;
    const latestPadded = latestDraw.padStart(5, '0');
    for (const r of results) {
      if (r[0].padStart(5, '0') > latestPadded) {
        newResults.push(r);
      } else {
        foundExisting = true;
        break;
      }
    }

    if (foundExisting) break;
    page++;
    await delay(300);
  }

  return newResults;
}

export async function fetchJackpotInfo(gameId: GameId = 'mega645'): Promise<{
  jackpot: string | null;
  jackpot_winners: string | null;
}> {
  try {
    const config = GAME_CONFIGS[gameId];
    if (!config.hasJackpot) return { jackpot: null, jackpot_winners: null };

    const slug = gameId === 'mega645' ? '645' : '655';
    const url = `${BASE_URL}/vi/trung-thuong/ket-qua-trung-thuong/${slug}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    let jackpot: string | null = null;
    let jackpotWinners: string | null = null;

    const soTienMatch = html.match(
      /<div[^>]*class="[^"]*so_tien[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (soTienMatch) {
      const h3Match = soTienMatch[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (h3Match) jackpot = stripTags(h3Match[1]);
    }

    const tableMatch = html.match(
      /<table[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/table>/i
    );
    if (tableMatch) {
      const tbMatch = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbMatch) {
        const firstRowMatch = tbMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
        if (firstRowMatch) {
          const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const tds: string[] = [];
          let tdM: RegExpExecArray | null;
          while ((tdM = tdRegex.exec(firstRowMatch[1])) !== null) {
            tds.push(stripTags(tdM[1]));
          }
          if (tds.length >= 3) jackpotWinners = tds[2];
        }
      }
    }

    return { jackpot, jackpot_winners: jackpotWinners };
  } catch {
    return { jackpot: null, jackpot_winners: null };
  }
}

export async function fetchAllGames(
  onProgress?: (gameId: GameId, page: number, count: number) => void
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const results = await Promise.allSettled(
    ALL_GAME_IDS.map(async (gameId) => {
      const latest = await getLatestDraw(gameId);
      let draws: DrawTuple[];
      if (latest) {
        draws = await fetchNew(gameId, latest);
      } else {
        draws = await fetchAllFrom(gameId, undefined, (page, count) => {
          onProgress?.(gameId, page, count);
        });
      }
      if (draws.length > 0) {
        await saveDraws(gameId, draws);
      }
      return { gameId, count: draws.length };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      counts[result.value.gameId] = result.value.count;
    } else {
      console.warn('fetchAllGames partial failure:', result.reason);
    }
  }

  return counts;
}
