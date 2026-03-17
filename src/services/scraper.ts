const BASE_URL = 'https://www.vietlott.vn';
const PAGE_URL = `${BASE_URL}/vi/trung-thuong/ket-qua-trung-thuong/winning-number-645`;
const AJAX_URL = `${BASE_URL}/ajaxpro/Vietlott.PlugIn.WebParts.Game645CompareWebPart,Vietlott.PlugIn.WebParts.ashx`;
const RENDER_INFO_URL = `${BASE_URL}/ajaxpro/Vietlott.Utility.WebEnvironments,Vietlott.Utility.ashx`;

const EMPTY_NUMBERS = Array(18).fill('');

async function getApiKey(): Promise<string> {
  const resp = await fetch(PAGE_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  const match = text.match(/ServerSideDrawResult\(RenderInfo,\s*'([a-f0-9]+)'/);
  if (!match) throw new Error('Could not extract API key from page');
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

async function fetchPage(
  key: string,
  renderInfo: any,
  pageIndex: number
): Promise<string> {
  const payload = {
    ORenderInfo: renderInfo,
    Key: key,
    GameDrawId: '',
    ArrayNumbers: Array(6).fill(EMPTY_NUMBERS),
    CheckMulti: false,
    PageIndex: pageIndex,
  };
  const resp = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AjaxPro-Method': 'ServerSideDrawResult',
      Referer: PAGE_URL,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const value = data.value || {};
  if (value.Error) throw new Error(`API error: ${value.InfoMessage}`);
  return value.HtmlContent || '';
}

/**
 * Strip HTML tags and return text content.
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Parse HTML table rows using regex (no cheerio/node:stream needed).
 * Each row has: date | draw number (inside <a>) | numbers (inside <span class="bong_tron">)
 */
function parseResults(html: string): [string, string, number[]][] {
  const results: [string, string, number[]][] = [];

  // Match each <tr>...</tr> inside tbody
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return results;

  const tbody = tbodyMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHtml = rowMatch[1];

    // Extract all <td> contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 3) continue;

    // Date from first td
    const dateStr = stripTags(tds[0]);

    // Draw number from <a> in second td
    const linkMatch = tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const drawNumber = stripTags(linkMatch[1]);

    // Numbers from <span class="bong_tron"> in third td
    const spanRegex = /<span[^>]*class="[^"]*bong_tron[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const numbers: number[] = [];
    let spanMatch: RegExpExecArray | null;
    while ((spanMatch = spanRegex.exec(tds[2])) !== null) {
      const num = parseInt(stripTags(spanMatch[1]), 10);
      if (!isNaN(num)) numbers.push(num);
    }
    if (numbers.length !== 6) continue;

    // Convert dd/mm/yyyy to yyyy-mm-dd
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const dateIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
    results.push([drawNumber, dateIso, numbers]);
  }

  return results;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAllFrom(
  startDraw = '01328',
  onProgress?: (page: number, count: number) => void
): Promise<[string, string, number[]][]> {
  const key = await getApiKey();
  const renderInfo = await getRenderInfo();
  const allResults: [string, string, number[]][] = [];
  let page = 0;
  let reachedStart = false;

  while (!reachedStart) {
    let html: string;
    try {
      html = await fetchPage(key, renderInfo, page);
    } catch (e) {
      if (page > 0) {
        try {
          const newKey = await getApiKey();
          html = await fetchPage(newKey, renderInfo, page);
        } catch {
          break;
        }
      } else {
        throw e;
      }
    }

    const results = parseResults(html);
    if (results.length === 0) break;

    for (const r of results) {
      const drawNum = r[0];
      if (parseInt(drawNum) >= parseInt(startDraw)) {
        allResults.push(r);
      }
      if (parseInt(drawNum) <= parseInt(startDraw)) {
        reachedStart = true;
        break;
      }
    }

    onProgress?.(page, allResults.length);
    page++;
    await delay(300);
  }

  return allResults;
}

export async function fetchNew(
  latestDraw: string
): Promise<[string, string, number[]][]> {
  const key = await getApiKey();
  const renderInfo = await getRenderInfo();
  const newResults: [string, string, number[]][] = [];
  let page = 0;

  while (true) {
    const html = await fetchPage(key, renderInfo, page);
    const results = parseResults(html);
    if (results.length === 0) break;

    let foundExisting = false;
    for (const r of results) {
      if (parseInt(r[0]) > parseInt(latestDraw)) {
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

export async function fetchJackpotInfo(): Promise<{
  jackpot: string | null;
  jackpot_winners: string | null;
}> {
  try {
    const url = `${BASE_URL}/vi/trung-thuong/ket-qua-trung-thuong/645`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    let jackpot: string | null = null;
    let jackpotWinners: string | null = null;

    // Jackpot value from div.so_tien > h3
    const soTienMatch = html.match(
      /<div[^>]*class="[^"]*so_tien[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (soTienMatch) {
      const h3Match = soTienMatch[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (h3Match) {
        jackpot = stripTags(h3Match[1]);
      }
    }

    // Winner count from first row of table.table
    const tableMatch = html.match(
      /<table[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/table>/i
    );
    if (tableMatch) {
      const tbodyMatch = tableMatch[1].match(
        /<tbody[^>]*>([\s\S]*?)<\/tbody>/i
      );
      if (tbodyMatch) {
        const firstRowMatch = tbodyMatch[1].match(
          /<tr[^>]*>([\s\S]*?)<\/tr>/i
        );
        if (firstRowMatch) {
          const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const tds: string[] = [];
          let tdMatch: RegExpExecArray | null;
          while ((tdMatch = tdRegex.exec(firstRowMatch[1])) !== null) {
            tds.push(stripTags(tdMatch[1]));
          }
          if (tds.length >= 3) {
            jackpotWinners = tds[2];
          }
        }
      }
    }

    return { jackpot, jackpot_winners: jackpotWinners };
  } catch {
    return { jackpot: null, jackpot_winners: null };
  }
}
