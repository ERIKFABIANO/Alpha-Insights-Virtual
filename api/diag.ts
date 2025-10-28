export const config = { runtime: 'nodejs' }

import { fetchRecentTransactions } from './supabase.js'

export default async function handler(req: any, res: any) {
  try {
    const txs = await fetchRecentTransactions(50)
    return res.status(200).json({ ok: true, count: txs.length })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) })
  }
}