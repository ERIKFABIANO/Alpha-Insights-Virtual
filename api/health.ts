export const config = { runtime: 'nodejs18.x' };

export default async function handler(_req: Request): Promise<Response> {
  const payload = { ok: true, ts: Date.now() };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}