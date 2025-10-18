export async function chat(prompt: string, files?: any[]) {
  const base = (import.meta as any)?.env?.VITE_API_BASE || ''
  const endpoint = `${base}/api/chat`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const body: any = { prompt }
  if (Array.isArray(files) && files.length > 0) {
    body.files = files
  }
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  if (!resp.ok) throw new Error(`API error: ${resp.status}`)
  const data = await resp.json()
  return data.response || data.message || ''
}

