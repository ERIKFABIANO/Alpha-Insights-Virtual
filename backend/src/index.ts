import express from "express";
import dotenv from "dotenv";
import { handleChat } from "./chatController";
import { ChatRequest } from "./types";
import { getAuthorizedUser } from "./googleAuth";
import { getDriveData } from "./driveService";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

// Log simples das requisições
app.use((req, res, next) => {
  console.log(`[index] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/debug/auth', async (_req, res) => {
  try {
    const user = await getAuthorizedUser();
    res.json({ user });
  } catch (err) {
    console.error('[index] ❌ Erro em /api/debug/auth:', err);
    res.status(500).json({ error: 'Falha ao obter usuário' });
  }
});

app.get('/api/debug/files', async (_req, res) => {
  try {
    const data = await getDriveData();
    const files = Object.entries(data).map(([name, rows]) => ({ name, rows: rows.length }));
    res.json({ files });
  } catch (err) {
    console.error('[index] ❌ Erro em /api/debug/files:', err);
    res.status(500).json({ error: 'Falha ao listar arquivos' });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    // Aceita tanto {message} quanto {prompt} do front
    const raw = req.body as any;
    const message = (raw?.message ?? raw?.prompt ?? "").toString();
    const result = await handleChat({ message } as ChatRequest);
    res.json({ response: result.reply });
  } catch (err) {
    console.error("[index] ❌ Erro na rota /api/chat:", err);
    res.json({ response: "Não consegui acessar os dados no momento. Tente novamente em instantes." });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`[index] 🚀 Servidor iniciado na porta ${PORT}`);
});