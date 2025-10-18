export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
    }

    const { prompt } = await req.json().catch(() => ({ prompt: '' }));

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
      return new Response(
        JSON.stringify({ response: 'Backend não configurado: defina GEMINI_API_KEY nas variáveis do projeto Vercel.' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: typeof prompt === 'string' ? prompt : '' }] }
      ]
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => 'unknown error');
      return new Response(
        JSON.stringify({ error: 'Erro na API Gemini', details: detail }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Falha no handler', details: e?.message || String(e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}