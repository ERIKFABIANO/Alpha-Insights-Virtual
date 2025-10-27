export const config = { runtime: 'nodejs' };

import type { NextApiRequest, NextApiResponse } from 'next'
import { insertFileWithRows } from './supabase'

function bufferFromBase64(input: string): Buffer {
  return Buffer.from(input, 'base64')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body) } catch { return {} } })() : (req.body || {})
    const { name, bufferBase64, content, encoding } = body as any
    const lower = (name || '').toLowerCase()

    let rows: Record<string, any>[] = []
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const XLSX = (await import('xlsx')).default
      const base64 = bufferBase64 || (encoding === 'base64' ? content : undefined)
      const buf = base64 ? bufferFromBase64(base64) : Buffer.from(content || '')
      const wb = XLSX.read(buf, { type: 'buffer' })
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[]
    } else if (lower.endsWith('.csv')) {
      const text = content || ''
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      const headers = lines[0]?.split(/;|,/).map(h => h.trim()) || []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/;|,/)
        const obj: Record<string, any> = {}
        headers.forEach((h, idx) => obj[h] = cols[idx] ?? '')
        rows.push(obj)
      }
    } else {
      return res.status(400).json({ error: 'Formato não suportado. Use CSV ou XLSX.' })
    }

    const limited = rows.slice(0, 5000)
    const { fileId } = await insertFileWithRows(name || 'arquivo', limited)
    return res.status(200).json({ ok: true, fileId, rowsInserted: limited.length })
  } catch (err: any) {
    return res.status(500).json({ error: 'Falha ao ingerir arquivo', details: err?.message || String(err) })
  }
}