export const config = { runtime: 'nodejs18.x' };

// Remover imports pesados do topo para evitar cold start lento
// import { google } from 'googleapis';
// import XLSX from 'xlsx';

type ChatBody = { prompt?: string; message?: string };

type DriveFile = { id: string; name: string; mimeType?: string };

function normalize(s: any): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parsePtNumber(v: any): number | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace(/[R$\s]/g, '');
  if (/^[-\d.,]+$/.test(s)) {
    const partsComma = s.split(',');
    if (partsComma.length === 2) {
      const whole = partsComma[0].replace(/\./g, '');
      const frac = partsComma[1];
      const joined = `${whole}.${frac}`;
      const n = Number(joined);
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(s.replace(/,/g, '.'));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function detectMonth(text: string): string | null {
  const t = normalize(text);
  const months = [
    'janeiro','fevereiro','marco','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ];
  const abbr = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  for (const m of months) if (t.includes(m)) return m.replace('março','marco');
  for (const a of abbr) if (t.includes(a)) {
    if (a === 'mar') return 'marco';
    const idx = abbr.indexOf(a);
    return months[idx];
  }
  return null;
}

function isExpenseRow(row: Record<string, any>): boolean {
  const tipo = normalize(row['Tipo'] ?? row['tipo']);
  if (tipo) {
    if (/(despesa|saida|saidas|gasto|gastos)/.test(tipo)) return true;
    if (/(receita|entrada|entradas)/.test(tipo)) return false;
  }
  const cat = normalize(row['Categoria'] ?? row['categoria'] ?? row['Descricao'] ?? row['descrição'] ?? row['descricao']);
  if (/(aluguel|conta|luz|agua|internet|mercado|compras|taxa|imposto|combustivel|transporte|telefone)/.test(cat)) return true;
  return true;
}

function pickNumericValue(row: Record<string, any>): number | null {
  const keys = Object.keys(row);
  const pref = ['real','valor','despesa','saida','gasto','total'];
  for (const p of pref) {
    const key = keys.find(k => normalize(k).includes(p));
    if (key) {
      const n = parsePtNumber(row[key]);
      if (n != null) return n;
    }
  }
  for (const k of keys) {
    const n = parsePtNumber(row[k]);
    if (n != null) return n;
  }
  return null;
}

async function readGoogleSheet(spreadsheetId: string, auth: any): Promise<Record<string, any>[]> {
  const { google } = await import('googleapis');
  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';
  const range = `${firstTitle}!A1:H500`;
  const valuesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = valuesRes.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      const key = (h || `col${i + 1}`).toString();
      obj[key] = row[i] ?? '';
    });
    return obj;
  });
}

async function readXlsxFile(fileId: string, auth: any): Promise<Record<string, any>[]> {
  const { google } = await import('googleapis');
  const XLSX = (await import('xlsx')).default;
  const drive = google.drive({ version: 'v3', auth });
  const resp = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(resp.data as ArrayBuffer);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const limited = (data as Record<string, any>[]).slice(0, 300);
  return limited;
}

async function listFilesFromDrive(folderId: string, auth: any): Promise<DriveFile[]> {
  const { google } = await import('googleapis');
  const drive = google.drive({ version: 'v3', auth });
  const q = `'${folderId}' in parents and trashed = false and (\n      mimeType = 'application/vnd.google-apps.spreadsheet' or\n      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or\n      mimeType = 'application/vnd.ms-excel'\n    )`;
  const res = await drive.files.list({ q, fields: 'files(id,name,mimeType)', pageSize: 50, orderBy: 'name' });
  return (res.data.files || []) as DriveFile[];
}

async function sumExpensesForFile(file: DriveFile, auth: any): Promise<number> {
  let rows: Record<string, any>[] = [];
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    rows = await readGoogleSheet(file.id, auth);
  } else {
    rows = await readXlsxFile(file.id, auth);
  }
  let sum = 0;
  for (const r of rows) {
    if (!isExpenseRow(r)) continue;
    const n = pickNumericValue(r);
    if (typeof n === 'number') sum += n;
  }
  return sum;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout ao acessar o Drive')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(err => { clearTimeout(t); reject(err); });
  });
}

async function fetchWithTimeout(url: string, opts: any, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
    }

    const { prompt, message }: ChatBody = await req.json().catch(() => ({ prompt: '' }));
    const question = typeof prompt === 'string' && prompt.length ? prompt : (typeof message === 'string' ? message : '');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || '';
    const folderId = process.env.DRIVE_FOLDER_ID || '';

    const haveGoogleCreds = Boolean(folderId && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REFRESH_TOKEN);
    if (haveGoogleCreds) {
      try {
        const { google } = await import('googleapis');
        const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        await withTimeout(oauth2.getAccessToken(), 5000);

        const files = await withTimeout(listFilesFromDrive(folderId, oauth2), 8000);
        const month = detectMonth(question || '');
        if (!month) {
          const names = files.map(f => f.name);
          const msg = names.length ? `Me diga o mês. Encontrei: ${names.join(', ')}.` : 'Não encontrei planilhas na pasta do Drive.';
          return new Response(JSON.stringify({ response: msg }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        const target = files.find(f => normalize(f.name).includes(month));
        if (!target) {
          const names = files.map(f => f.name);
          const msg = names.length ? `Não achei planilha para "${month}". Disponíveis: ${names.join(', ')}.` : 'Não encontrei planilhas na pasta do Drive.';
          return new Response(JSON.stringify({ response: msg }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        const total = await withTimeout(sumExpensesForFile(target, oauth2), 10000);
        const quickAnswer = `Total de despesas em ${target.name}: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
        return new Response(JSON.stringify({ response: quickAnswer }), { status: 200, headers: { 'content-type': 'application/json' } });
      } catch (e: any) {
        console.error('Drive compute error:', e?.message || e);
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ response: 'Configure GEMINI_API_KEY nas variáveis do projeto Vercel.' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const contextText = `Pergunta: ${question}.`;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [ { parts: [{ text: contextText }] } ] };
    const resp = await fetchWithTimeout(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, 10000);
    if (!resp.ok) {
      const detail = await resp.text().catch(() => 'unknown error');
      return new Response(JSON.stringify({ error: 'Erro na API', details: detail }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';

    return new Response(JSON.stringify({ response: text }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Falha no handler', details: e?.message || String(e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}