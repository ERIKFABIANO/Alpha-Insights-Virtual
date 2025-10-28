export const config = { runtime: 'nodejs' };

import { fetchRecentTransactions } from './supabase.js'

export default async function handler(req: any, res: any) {
  try {
    const txs = await fetchRecentTransactions(10); // Apenas 10 para debug
    
    const debug = {
      count: txs.length,
      sample: txs.slice(0, 3).map(t => ({
        id: t.id,
        file_id: t.file_id,
        date: t.date,
        category: t.category,
        description: t.description,
        amount: t.amount,
        amount_type: typeof t.amount,
        amount_parsed: typeof t.amount === 'number' ? t.amount : 'not_number'
      }))
    };
    
    return res.status(200).json(debug);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}