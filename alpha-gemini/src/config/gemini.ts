export async function chat(prompt: string) {
  const base = (import.meta as any)?.env?.VITE_API_BASE || ''
  const endpoint = `${base}/api/chat`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  if (!resp.ok) throw new Error(`API error: ${resp.status}`)
  const data = await resp.json()
  return data.response || data.message || ''
}

