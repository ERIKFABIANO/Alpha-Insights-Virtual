export const config = { runtime: 'nodejs' };

import { google } from 'googleapis';

type ChatBody = { prompt?: string; message?: string };

async function listFilesFromDrive(folderId: string, auth: any): Promise<{ id: string; name: string; mimeType?: string }[]> {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType)'
  });
  return res.data.files || [];
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
    }

    const { prompt, message }: ChatBody = await req.json().catch(() => ({ prompt: '' }));
    const question = typeof prompt === 'string' && prompt.length ? prompt : (typeof message === 'string' ? message : '');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || '';
    if (!apiKey) {
      return new Response(
        JSON.stringify({ response: 'Backend não configurado: defina GEMINI_API_KEY nas variáveis do projeto Vercel.' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Tenta listar arquivos do Drive para dar contexto
    const folderId = process.env.DRIVE_FOLDER_ID || '';
    let fileNames: string[] = [];
    try {
      if (folderId && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REFRESH_TOKEN) {
        const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        await oauth2.getAccessToken();
        const files = await listFilesFromDrive(folderId, oauth2);
        fileNames = files.map(f => f.name);
      }
    } catch (e) {
      // se falhar, segue sem contexto de arquivos
      fileNames = [];
    }

    const contextText = fileNames.length ? `Arquivos na pasta: ${fileNames.join(', ')}.` : 'Sem contexto de arquivos (verifique credenciais do Google e compartilhamento da pasta).';

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        { parts: [{ text: `Contexto:\n${contextText}\n\nPergunta:\n${question}` }] }
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
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';

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