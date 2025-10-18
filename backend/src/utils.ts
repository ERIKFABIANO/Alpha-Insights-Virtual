export function cleanText(str: string): string {
  try {
    return str
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return String(str ?? "").trim();
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}