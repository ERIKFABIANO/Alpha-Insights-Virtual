import { getDriveData } from "./driveService";
import { askLLM } from "./llmService";
import { ChatRequest, ChatResponse } from "./types";
import { nowIso } from "./utils";

export async function handleChat(reqBody: ChatRequest): Promise<ChatResponse> {
  const start = Date.now();
  try {
    const question = reqBody?.message?.toString() || "";
    if (!question) {
      return { reply: "Mensagem vazia. Envie uma pergunta válida." };
    }

    const data = await getDriveData();
    const reply = await askLLM(data, question);
    const duration = Date.now() - start;
    console.log(`[chatController] ⏱️ Tempo total: ${duration}ms (${nowIso()})`);
    return { reply };
  } catch (err) {
    console.error("[chatController] ❌ Erro ao processar chat:", err);
    return { reply: "Não consegui acessar os dados no momento. Tente novamente em instantes." };
  }
}