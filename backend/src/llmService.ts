import dotenv from "dotenv";
import fetch from "node-fetch";
import { cleanText } from "./utils";

dotenv.config();

const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = "gemini-2.0-flash"; // conforme lista de modelos v1

function buildPrompt(context: string, question: string): string {
  const header = "Você é um assistente que responde com base nos dados abaixo. Seja claro e objetivo.\n\n";
  return `${header}Contexto:\n${context}\n\nPergunta do usuário:\n${question}`;
}

function toTextContext(data: Record<string, any[]>): string {
  const parts: string[] = [];
  for (const [name, rows] of Object.entries(data)) {
    const max = 20; // limita linhas por planilha
    const sample = rows.slice(0, max).map((r) => cleanText(JSON.stringify(r)));
    parts.push(`Arquivo: ${name}\n${sample.join("\n")}`);
  }
  return parts.join("\n\n");
}

export async function askLLM(contextData: Record<string, any[]>, question: string): Promise<string> {
  if (!API_KEY) {
    console.error("[llmService] ❌ LLM_API_KEY ausente no .env.");
    return "Não consegui acessar os dados no momento. Tente novamente em instantes.";
  }

  const context = toTextContext(contextData);
  const prompt = buildPrompt(context, question);

  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal as any,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[llmService] ❌ Erro LLM:", resp.status, txt);
      return "Não consegui acessar os dados no momento. Tente novamente em instantes.";
    }

    const data = (await resp.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n");
    return cleanText(text || "Sem resposta do modelo.");
  } catch (err) {
    console.error("[llmService] ❌ Falha de rede/timeout:", err);
    return "Não consegui acessar os dados no momento. Tente novamente em instantes.";
  }
}