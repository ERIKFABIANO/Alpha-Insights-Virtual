import { drive, sheets, ensureAccessToken } from "./googleAuth";
import { SheetData, DriveDataMap } from "./types";

const FOLDER_ID = process.env.DRIVE_FOLDER_ID || "";

export async function getDriveData(): Promise<DriveDataMap> {
  const result: DriveDataMap = {};
  try {
    await ensureAccessToken();
    if (!FOLDER_ID) {
      console.warn("[driveService] ⚠️ DRIVE_FOLDER_ID não definido no .env.");
      return result;
    }

    const q = `'${FOLDER_ID}' in parents and trashed = false and (
      mimeType = 'application/vnd.google-apps.spreadsheet' or 
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or 
      mimeType = 'application/vnd.ms-excel'
    )`;

    const { data } = await drive.files.list({
      q,
      fields: "files(id, name, mimeType)",
      pageSize: 1000,
    });
    const files = data.files || [];
    console.log(`[driveService] 📄 ${files.length} arquivos encontrados na pasta.`);

    for (const file of files) {
      const name = file.name || file.id || "arquivo";
      const mime = file.mimeType || "";
      try {
        if (mime === "application/vnd.google-apps.spreadsheet") {
          const values = await readGoogleSheet(file.id!);
          result[name] = values;
        } else if (
          mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          mime === "application/vnd.ms-excel"
        ) {
          const values = await readXlsxFile(file.id!);
          result[name] = values;
        } else {
          console.log(`[driveService] Ignorando ${name} (mimeType: ${mime}).`);
        }
      } catch (err) {
        console.error(`[driveService] ❌ Erro ao processar ${name}:`, err);
      }
    }
  } catch (err) {
    console.error("[driveService] ❌ Erro ao listar arquivos do Drive:", err);
  }
  return result;
}

async function readGoogleSheet(spreadsheetId: string): Promise<SheetData[]> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstTitle = meta.data.sheets?.[0]?.properties?.title || "Sheet1";
  const range = `${firstTitle}!A1:Z1000`;
  const valuesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = valuesRes.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: SheetData = {};
    headers.forEach((h, i) => {
      const key = (h || `col${i + 1}`).toString();
      obj[key] = row[i] ?? "";
    });
    return obj;
  });
}

import type { Readable } from "stream";
import XLSX from "xlsx";

async function readXlsxFile(fileId: string): Promise<SheetData[]> {
  const resp = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  const stream = resp.data as unknown as Readable;
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve());
    stream.on("error", (e) => reject(e));
  });
  const buffer = Buffer.concat(chunks);
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return data as SheetData[];
}