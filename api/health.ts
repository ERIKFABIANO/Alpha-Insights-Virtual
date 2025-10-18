export const config = { runtime: 'nodejs' };

export default function handler(_req: any, res: any) {
  const payload = { ok: true, ts: Date.now() };
  return res.status(200).json(payload);
}