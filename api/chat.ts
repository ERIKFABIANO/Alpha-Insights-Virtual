export const config = { runtime: 'nodejs' };

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

function isExpenseRow(row: Record<string, any>): boolean {
  const keys = Object.keys(row);
  const joined = keys.join(' ').toLowerCase();
  if (joined.includes('despesa') || joined.includes('gasto') || joined.includes('expense')) return true;
  // heurística: se a linha tem colunas de valores com números negativos
  for (const k of keys) {
    const v = parsePtNumber(row[k]);
    if (typeof v === 'number' && v < 0) return true;
  }
  return false;
}

function pickNumericValue(row: Record<string, any>): number | null {
  // Procura primeiro colunas que são típicas
  for (const key of Object.keys(row)) {
    const lk = key.toLowerCase();
    if (lk.includes('valor') || lk.includes('real') || lk.includes('despesa') || lk.includes('expense') || lk.includes('total')) {
      const n = parsePtNumber(row[key]);
      if (typeof n === 'number') return n;
    }
  }
  // fallback: pega o primeiro campo numérico
  for (const key of Object.keys(row)) {
    const n = parsePtNumber(row[key]);
    if (typeof n === 'number') return n;
  }
  return null;
}

function detectMonth(text: string): string | null {
  const t = normalize(text);
  const months = ['janeiro','fevereiro','marco','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  for (const m of months) {
    if (t.includes(m)) return m;
  }
  return null;
}

// Detecção mais robusta de mês e ano a partir do texto
function detectMonthInfo(text: string): { monthName: string | null; monthNum: string | null; year: string | null } {
  const t = normalize(text);
  const monthMap: Record<string, string> = {
    'janeiro': '01', 'jan': '01',
    'fevereiro': '02', 'fev': '02',
    'marco': '03', 'mar': '03',
    'abril': '04', 'abr': '04',
    'maio': '05', 'mai': '05',
    'junho': '06', 'jun': '06',
    'julho': '07', 'jul': '07',
    'agosto': '08', 'ago': '08',
    'setembro': '09', 'set': '09',
    'outubro': '10', 'out': '10',
    'novembro': '11', 'nov': '11',
    'dezembro': '12', 'dez': '12',
  };

  let year: string | null = null;
  const yearMatch = t.match(/\b(20\d{2})\b/);
  if (yearMatch) year = yearMatch[1];

  // 1) Tentar palavras completas e abreviações
  for (const k of Object.keys(monthMap)) {
    if (t.includes(k)) {
      return { monthName: k, monthNum: monthMap[k], year };
    }
  }

  // 2) Tentar padrões numéricos: YYYY-MM, MM/YYYY, MM-YYYY, ou menções isoladas de MM
  const isoMatch = t.match(/\b(20\d{2})[-\/](0[1-9]|1[0-2])\b/); // 2025-03 ou 2025/03
  if (isoMatch) {
    return { monthName: null, monthNum: isoMatch[2], year: isoMatch[1] };
  }

  const revMatch = t.match(/\b(0[1-9]|1[0-2])[-\/](20\d{2})\b/); // 03/2025 ou 03-2025
  if (revMatch) {
    return { monthName: null, monthNum: revMatch[1], year: revMatch[2] };
  }

  const loneMonth = t.match(/\b(0[1-9]|1[0-2])\b/); // menção isolada: 03
  if (loneMonth) {
    return { monthName: null, monthNum: loneMonth[1], year };
  }

  return { monthName: null, monthNum: null, year: null };
}

function detectCategory(question: string, rows: Record<string, any>[]): string | null {
  const q = normalize(question);
  if (!q) return null;
  const candidates = new Set<string>();
  for (const r of rows) {
    const c = r['Categoria'] || r['Category'] || '';
    const s = String(c).trim();
    if (s) candidates.add(s);
  }
  for (const cat of candidates) {
    const n = normalize(cat);
    if (n && q.includes(n)) return cat;
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

async function readRowsForFile(file: DriveFile, auth: any): Promise<Record<string, any>[]> {
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    return await readGoogleSheet(file.id, auth);
  }
  return await readXlsxFile(file.id, auth);
}

function toCsvPreview(rows: Record<string, any>[], maxRows = 40): string {
  if (!rows.length) return 'vazio';
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const headerLine = headers.join(';');
  const lines: string[] = [headerLine];
  for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
    const r = rows[i];
    const vals = headers.map(h => String(r[h] ?? ''));
    lines.push(vals.join(';'));
  }
  return lines.join('\n');
}

function parseCsvRows(text: string): Record<string, any>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = lines[0].split(/;|,/).map(h => h.trim());
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/;|,/);
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    rows.push(obj);
  }
  return rows;
}

function bufferFromBase64(input: string): Buffer {
  return Buffer.from(input, 'base64')
}

async function rowsFromUpload(upload: { name: string, type?: string, size?: number, content?: string, encoding?: string, bufferBase64?: string }): Promise<Record<string, any>[]> {
  const lower = (upload.name || '').toLowerCase()
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const XLSX = (await import('xlsx')).default
    const base64 = upload.bufferBase64 || (upload.encoding === 'base64' ? upload.content : undefined)
    const buf = base64 ? bufferFromBase64(base64) : Buffer.from(upload.content || '')
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheetName = wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[]
    return data.slice(0, 400)
  }
  if (lower.endsWith('.csv')) {
    const base64 = upload.bufferBase64 || (upload.encoding === 'base64' ? upload.content : undefined)
    const text = base64 ? Buffer.from(base64 as string, 'base64').toString('utf8') : (upload.content || '')
    return parseCsvRows(text).slice(0, 400)
  }
  // outros formatos não suportados diretamente
  return []
}

async function summarizeRowsWithLLM(rows: Record<string, any>[], apiKey: string, fileName: string, question: string): Promise<string | null> {
  try {
    const csv = toCsvPreview(rows, 80);
    const contextText = [
      `Pergunta do usuário: ${question}`,
      `Você é um assistente financeiro. Use Markdown na resposta.`,
      `Abaixo está uma amostra das linhas extraídas da planilha "${fileName}" (CSV).`,
      `Amostra:`,
      csv,
      `Tarefa: gere um resumo objetivo, em pt-BR, com Markdown (títulos, listas e tabelas quando possível).`,
      `Use seções como: Orçamento Mensal, Despesas, Renda, Poupança, Pagamento.`,
      `Onde houver colunas Planejado/Real/Diferença, reporte os valores exatos encontrados.`,
      `Não invente valores. Se o dado não existir na amostra, omita-o.`,
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [ { parts: [{ text: contextText }] } ] };
    const resp = await fetchWithTimeout(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, 12000);
    if (!resp.ok) return null;
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';
    return text || null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const bodyRaw = req.body;
    const body = typeof bodyRaw === 'string' ? (() => { try { return JSON.parse(bodyRaw); } catch { return {}; } })() : (bodyRaw || {});
    const { prompt, message, files }: any = body as any;
    const question = typeof prompt === 'string' && prompt.length ? prompt : (typeof message === 'string' ? message : '');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || '';

    // 1) Se veio upload direto do usuário, priorizar essa leitura
    if (Array.isArray(files) && files.length > 0) {
      try {
        const first = files[0];
        const rows = await withTimeout(rowsFromUpload(first), 8000);
        if (rows.length) {
          const intent = detectIntent(question || '');
          const monthInfo = detectMonthInfo(question || '');

          // Se o usuário perguntou por mês, filtrar linhas por mês
          if (monthInfo.monthNum) {
            const monthNum = monthInfo.monthNum;
            const filtered = rows.filter(r => {
              const d = r['Data'] || r['Date'] || '';
              if (!d) return false;
              try {
                const dt = new Date(d);
                if (!isNaN(dt.getTime())) {
                  return String(dt.getMonth() + 1).padStart(2, '0') === monthNum;
                }
              } catch {}
              // fallback: checar substring do mês
              const ds = String(d).toLowerCase();
              return ds.includes(monthNum) || ds.includes(getMonthNamePortuguese(monthNum));
            });
            const detectedCategory = detectCategory(question || '', filtered);
            const filteredByCategory = detectedCategory
              ? filtered.filter(r => normalize(r['Categoria'] || r['Category'] || '').includes(normalize(detectedCategory)))
              : filtered;

            let total = 0;
            for (const r of filteredByCategory) {
              const n = pickNumericValue(r);
              if (typeof n === 'number') total += Math.abs(n);
            }
            const md = [
              `## Gastos em ${getMonthNamePtFull(monthNum)}`,
              detectedCategory ? `- Categoria: ${detectedCategory}` : undefined,
              `- Linhas consideradas: ${filteredByCategory.length}`,
              `- Total de despesas: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            ].filter(Boolean).join('\n');
            return res.status(200).json({ response: md });
          }

          if (intent.kind === 'expense') {
            const total = sumExpensesFromRows(rows);
            const txt = `Total de despesas: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
            return res.status(200).json({ response: txt });
          }
          if (apiKey) {
            const summary = await summarizeRowsWithLLM(rows, apiKey, first?.name || 'arquivo', question || '');
            if (summary) return res.status(200).json({ response: summary });
          }
          // Fallback: calcular total básico quando possível
          let sum = 0;
          for (const r of rows) {
            const n = pickNumericValue(r);
            if (typeof n === 'number') sum += n;
          }
          const fallbackMd = `**Resumo rápido (parcial)**\n\n- Arquivo: ${first?.name || 'arquivo'}\n- Linhas analisadas: ${rows.length}\n- Soma aproximada de valores numéricos: ${sum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
          return res.status(200).json({ response: fallbackMd });
        }
      } catch (e: any) {
        console.error('Upload parse error:', e?.message || e);
      }
    }

    // 2) Caso não haja upload, consulta dados no Supabase (se houver)
    try {
      const txs = await fetchRecentTransactions(2000)
      if (txs.length > 0) {
        const intent = detectIntent(question || '')
        const monthInfo = detectMonthInfo(question || '')
        
        if (intent.kind === 'expense' || monthInfo.monthNum) {
          // Análise detalhada de gastos
          try {
            const analysis = analyzeTransactions(txs, question || '', monthInfo)
            return res.status(200).json({ response: analysis })
          } catch (err:any) {
            const msg = err?.message || String(err)
            return res.status(200).json({ error: 'analysis_fail', details: msg })
          }
        }
        
        // Sem intenção específica: liste últimos arquivos/linhas
        const byFile: Record<string, number> = {}
        for (const t of txs) {
          const fid = String(t.file_id ?? 'desconhecido')
          byFile[fid] = (byFile[fid] || 0) + 1
        }
        const md = [
          '**Dados no banco (amostra recente)**',
          ...Object.entries(byFile).map(([fid, count]) => `- Arquivo ${fid}: ${count} linhas`)
        ].join('\n')
        return res.status(200).json({ response: md })
      }
    } catch (err:any) {
      // Ignora erros de conexão e segue para fallback LLM
      console.error('Supabase query error:', err?.message || err)
    }

    // 3) Fallback puro via LLM se não há credenciais e sem upload
    if (!apiKey) {
      return res.status(200).json({ response: 'Envie uma planilha (CSV/XLSX) pelo clipe para eu analisar e responder em Markdown.' });
    }
    const promptText = question || 'Responda em pt-BR usando Markdown.';
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [ { parts: [{ text: promptText }] } ] };
    const resp = await fetchWithTimeout(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, 12000);
    if (!resp.ok) {
      const detail = await resp.text().catch(() => 'unknown error');
      return res.status(500).json({ error: 'Erro na API', details: detail });
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';

    return res.status(200).json({ response: text });
  } catch (e: any) {
    return res.status(500).json({ error: 'Falha no handler', details: e?.message || String(e) });
  }
}

function detectIntent(text: string): { kind: 'expense' | 'income' | 'savings' | 'balance' | 'generic' } {
  const t = normalize(text);
  if (!t) return { kind: 'generic' };
  // Cobrir variações comuns de "gastos"
  const expenseTerms = [
    'despesa','despesas',
    'gasto','gastos',
    'gastar','gaste','gastei','gastou','gastamos','gastaria',
    'saida','saidas','saída','saídas'
  ];
  for (const term of expenseTerms) {
    if (t.includes(term)) return { kind: 'expense' };
  }
  // Heurística: qualquer menção a "gast" indica intenção de despesa
  if (t.includes('gast')) return { kind: 'expense' };
  return { kind: 'generic' };
}

function analyzeTransactions(txs: any[], question: string, monthInfo: { monthName: string | null; monthNum: string | null; year: string | null }): string {
  // Filtrar por mês se especificado
  let filteredTxs = txs;
  if (monthInfo?.monthNum) {
    filteredTxs = txs.filter(t => {
      if (t.date) {
        const dateStr = String(t.date).toLowerCase();
        // ISO YYYY-MM-DD
        const iso = dateStr.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(\d{2})\b/);
        if (iso) {
          const mm = iso[2];
          const yyyy = iso[1];
          if (mm === monthInfo.monthNum && (!monthInfo.year || monthInfo.year === yyyy)) return true;
        }
        // BR DD/MM/YYYY
        const br = dateStr.match(/\b(\d{2})\/(0[1-9]|1[0-2])\/(20\d{2})\b/);
        if (br) {
          const mm = br[2];
          const yyyy = br[3];
          if (mm === monthInfo.monthNum && (!monthInfo.year || monthInfo.year === yyyy)) return true;
        }
        // Texto com mês
        const monthWord = getMonthNamePortuguese(monthInfo.monthNum!);
        if (monthWord && dateStr.includes(monthWord)) return true;
        // Substring do número do mês
        if (dateStr.includes(monthInfo.monthNum!)) return true;
      }
      return false;
    });
  }

  // Análise de gastos (valores positivos e negativos)
  let totalExpenses = 0;
  let totalIncome = 0;
  const categories: Record<string, number> = {};
  const monthlyData: Record<string, number> = {};
  let validTransactions = 0;

  for (const t of filteredTxs) {
    // Usar a mesma lógica de parsing que o supabase.ts
    let amount = t.amount;
    if (typeof amount !== 'number') {
      amount = parsePtNumber(amount);
    }
    
    if (typeof amount !== 'number' || amount === 0) continue;
    
    validTransactions++;

    // Categorizar por tipo de transação
    const category = t.category || t.description || 'Outros';
    const absAmount = Math.abs(amount);
    categories[category] = (categories[category] || 0) + absAmount;

    // Separar receitas e despesas (assumindo que valores negativos são despesas)
    if (amount < 0) {
      totalExpenses += absAmount;
    } else {
      totalIncome += amount;
    }

    // Agrupar por mês
    if (t.date) {
      try {
        const date = new Date(t.date);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + absAmount;
        }
      } catch (e) {
        // Ignorar datas inválidas
      }
    }
  }

  // Construir resposta
  let response = '';
  
  if (monthInfo?.monthNum) {
    const monthTitle = getMonthNamePtFull(monthInfo.monthNum);
    response += `## Análise para ${monthTitle}${monthInfo.year ? `/${monthInfo.year}` : ''}\n\n`;
    if (filteredTxs.length === 0) {
      response += `❌ Nenhuma transação encontrada para ${monthTitle}.\n\n`;
      return response;
    }
  } else {
    response += `## Análise Financeira (${validTransactions} transações válidas de ${filteredTxs.length} total)\n\n`;
  }

  if (validTransactions === 0) {
    response += `❌ Nenhuma transação com valores válidos encontrada.\n\n`;
    return response;
  }

  response += `**💰 Resumo Financeiro:**\n`;
  response += `- Total de Despesas: ${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
  response += `- Total de Receitas: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
  response += `- Saldo: ${(totalIncome - totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;

  // Top categorias
  const sortedCategories = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (sortedCategories.length > 0) {
    response += `**📊 Top 5 Categorias:**\n`;
    for (const [cat, amount] of sortedCategories) {
      response += `- ${cat}: ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
    response += '\n';
  }

  // Dados mensais (se não filtrado por mês específico)
  if (!monthInfo?.monthNum && Object.keys(monthlyData).length > 1) {
    response += `**📅 Gastos por Mês:**\n`;
    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);
    
    for (const [month, amount] of sortedMonths) {
      const [year, monthNum] = month.split('-');
      const monthName = getMonthName(parseInt(monthNum));
      response += `- ${monthName}/${year}: ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
  }

  return response;
}

function getMonthNumber(monthName: string): string {
  const months = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
    'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  return months[monthName as keyof typeof months] || '';
}

function getMonthName(monthNum: number): string {
  const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthNum] || '';
}

function getMonthNamePtFull(monthNumStr: string): string {
  const map: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
    '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  };
  return map[monthNumStr] || monthNumStr;
}

function getMonthNamePortuguese(monthNumStr: string): string | null {
  const map: Record<string, string> = {
    '01': 'janeiro', '02': 'fevereiro', '03': 'marco', '04': 'abril', '05': 'maio', '06': 'junho',
    '07': 'julho', '08': 'agosto', '09': 'setembro', '10': 'outubro', '11': 'novembro', '12': 'dezembro'
  };
  return map[monthNumStr] || null;
}

function sumExpensesFromRows(rows: Record<string, any>[]): number {
  let total = 0;
  for (const r of rows) {
    if (isExpenseRow(r)) {
      const n = pickNumericValue(r);
      if (typeof n === 'number') total += n;
    }
  }
  return total;
}
import { fetchRecentTransactions } from './supabase.js'