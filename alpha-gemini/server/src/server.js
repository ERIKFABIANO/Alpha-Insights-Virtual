const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json({limit: '5mb'}))

// Health check
app.get('/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()})
})

// Placeholder rota /chat (pronto para integração futura)
app.post('/chat', async (req, res) => {
  const { prompt } = req.body || {}
  // Aqui integraremos com Gemini futuramente
  res.json({ message: 'chat route ready', echo: prompt ?? null })
})

// Rota /export para exportar conversas
app.post('/export', (req, res) => {
  const conversation = req.body || {}
  const json = JSON.stringify(conversation, null, 2)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="conversa-${Date.now()}.json"`)
  res.send(json)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})