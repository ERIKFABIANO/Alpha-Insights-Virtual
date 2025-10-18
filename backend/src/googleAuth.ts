import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth2callback";
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || "";

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("[googleAuth] ❌ Variáveis de OAuth ausentes. Confira GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no .env");
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
} else {
  console.warn("[googleAuth] ⚠️ GOOGLE_REFRESH_TOKEN não definido. Rode o script de auth para gerar o token.");
}

export async function ensureAccessToken(): Promise<string | null> {
  try {
    const token = await oauth2Client.getAccessToken();
    if (token?.token) {
      console.log("[googleAuth] ✅ Access token obtido.");
      return token.token;
    } else {
      console.warn("[googleAuth] ⚠️ Access token vazio.");
      return null;
    }
  } catch (err) {
    console.error("[googleAuth] ❌ Erro ao obter/renovar access token:", err);
    return null;
  }
}

export const drive = google.drive({ version: "v3", auth: oauth2Client });
export const sheets = google.sheets({ version: "v4", auth: oauth2Client });

export async function getAuthorizedUser(): Promise<{ email?: string; name?: string } | null> {
  try {
    const about = await drive.about.get({ fields: 'user(emailAddress,displayName)' });
    const email = about.data.user?.emailAddress || '';
    const name = about.data.user?.displayName || '';
    return { email, name };
  } catch (err) {
    console.error('[googleAuth] ⚠️ Não foi possível obter usuário Drive:', err);
    return null;
  }
}