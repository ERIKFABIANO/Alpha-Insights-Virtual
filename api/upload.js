export const config = { runtime: 'nodejs' };

import { insertFileWithRows } from './supabase.js'

function bufferFromBase64(input) {
  return Buffer.from(input, 'base64')
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body) } catch { return {} } })() : (req.body || {})
    const { name, bufferBase64, content, encoding } = body
    const lower = (name || '').toLowerCase()

    let rows = []
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const XLSX = (await import('xlsx')).default
      const base64 = bufferBase64 || (encoding === 'base64' ? content : undefined)
      const buf = base64 ? bufferFromBase64(base64) : Buffer.from(content || '')
      const wb = XLSX.read(buf, { type: 'buffer' })
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } else if (lower.endsWith('.csv')) {
      // Suportar conteúdo em base64 (caso clientes enviem como buffer)
      const base64 = bufferBase64 || (encoding === 'base64' ? content : undefined)
      const text = base64 ? Buffer.from(base64, 'base64').toString('utf8') : (typeof content === 'string' ? content : String(content || ''))
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      const headers = lines[0]?.split(/;|,/).map(h => h.trim()) || []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/;|,/)
        const obj = {}
        headers.forEach((h, idx) => obj[h] = cols[idx] ?? '')
        rows.push(obj)
      }
    } else {
      return res.status(400).json({ error: 'Formato não suportado. Use CSV ou XLSX.' })
    }

    const limited = rows.slice(0, 5000)
    const { fileId } = await insertFileWithRows(name || 'arquivo', limited)
    return res.status(200).json({ ok: true, fileId, rowsInserted: limited.length })
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao ingerir arquivo', details: err?.message || String(err) })
  }
}