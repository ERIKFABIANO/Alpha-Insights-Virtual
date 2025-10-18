// auth.ts
import { google } from "googleapis";
import dotenv from "dotenv";
import readline from "readline";
import fs from "fs";
import path from "path";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env antes de rodar este script.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

function saveRefreshToken(refreshToken: string) {
  const envPath = path.resolve(process.cwd(), ".env");
  let envContent = "";
  if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, "utf8");

  const key = "GOOGLE_REFRESH_TOKEN";
  const line = `${key}=${refreshToken}`;

  if (envContent.includes(`${key}=`)) {
    const newContent = envContent.replace(new RegExp(`${key}=.*`), line);
    fs.writeFileSync(envPath, newContent, "utf8");
  } else {
    const newContent = envContent + (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + line + "\n";
    fs.writeFileSync(envPath, newContent, "utf8");
  }
  console.log(`✅ Salvou ${key} no arquivo ${envPath}`);
}

async function exchangeCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    if (!tokens.refresh_token) {
      console.warn("⚠️ Nenhum refresh_token retornado. Garanta 'access_type=offline' e 'prompt=consent'.");
    } else {
      console.log("\n✅ REFRESH TOKEN GERADO:\n", tokens.refresh_token, "\n");
      saveRefreshToken(tokens.refresh_token);
      console.log("✋ Não compartilhe o .env publicamente.");
    }
  } catch (err) {
    console.error("❌ Erro ao trocar code por tokens:", err);
  }
}

const argCode = process.argv.find(a => a.startsWith("--code="))?.split("=")[1] || process.env.CODE;

if (argCode) {
  // Modo não-interativo (via argumento ou env)
  exchangeCode(argCode).then(() => process.exit(0));
} else {
  // Modo interativo: imprime link e pede code
  const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });
  console.log("🌐 Abra este link no navegador e autorize o app:\n");
  console.log(authUrl, "\n");
  console.log("Depois de autorizar, copie o valor do parâmetro `code` da URL e cole aqui, ou rode `npx ts-node auth.ts --code=SEU_CODE`.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Cole o code aqui: ", async (code) => {
    await exchangeCode(code);
    rl.close();
  });
}