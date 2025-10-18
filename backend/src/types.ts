export interface ChatRequest { message: string }
export interface ChatResponse { reply: string }
export interface SheetData { [key: string]: any }

export type DriveDataMap = Record<string, any[]>;