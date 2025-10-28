import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
})

export type DbTransaction = {
  id?: number
  file_id?: number
  date?: string | null
  category?: string | null
  description?: string | null
  amount?: number | null
  raw?: any
}

function parsePtNumber(v: any): number | null {
  if (v == null) return null
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/[R$\s]/g, '')
  if (/^[-\d.,]+$/.test(s)) {
    const partsComma = s.split(',')
    if (partsComma.length === 2) {
      const whole = partsComma[0].replace(/\./g, '')
      const frac = partsComma[1]
      const joined = `${whole}.${frac}`
      const n = Number(joined)
      return Number.isFinite(n) ? n : null
    }
    const n = Number(s.replace(/,/g, '.'))
    return Number.isFinite(n) ? n : null
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export async function insertFileWithRows(name: string, rows: Record<string, any>[]): Promise<{ fileId?: number }>{
  const { data: fileIns, error: fileErr } = await supabase.from('files').insert({ name }).select('id').limit(1)
  if (fileErr) throw fileErr
  const fileId = fileIns?.[0]?.id as number

  const mapped: DbTransaction[] = rows.map((r) => ({
    file_id: fileId,
    date: (r['Data'] || r['Date'] || null) as any,
    category: (r['Categoria'] || r['Category'] || null) as any,
    description: (r['Descrição'] || r['Description'] || null) as any,
    amount: (() => {
      // Aceitar variações comuns de cabeçalho para valor
      const rawVal = r['Valor'] ?? r['Amount'] ?? r['Valor (R$)'] ?? r['Valor(R$)'] ?? r['Valor R$'] ?? null
      if (typeof rawVal === 'number') return rawVal
      const parsed = parsePtNumber(rawVal)
      return parsed
    })(),
    raw: r,
  }))

  if (mapped.length) {
    const { error: txErr } = await supabase.from('transactions').insert(mapped)
    if (txErr) throw txErr
  }
  return { fileId }
}

export async function fetchRecentTransactions(limit = 2000): Promise<DbTransaction[]>{
  const { data, error } = await supabase
    .from('transactions')
    .select('date, category, description, amount, file_id, id')
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as DbTransaction[]
}