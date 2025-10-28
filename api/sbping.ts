export const config = { runtime: 'nodejs' };

export default async function handler(_req: any, res: any) {
  try {
    const { fetchRecentTransactions } = await import('./supabase.js');
    const rows = await fetchRecentTransactions(1);
    return res.status(200).json({ ok: true, sample: rows.length });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}