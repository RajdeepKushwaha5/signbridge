import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import grammarRouter from './features/grammar.js'
import readingRouter from './features/reading.js'
import { rateLimit } from './middleware/rateLimit.js'

function isAllowedOrigin(origin) {
  if (!origin) return true // same-origin / curl / server-to-server
  if (config.allowedOrigins.includes(origin)) return true
  try {
    const { protocol, hostname } = new URL(origin)
    // Allow the production frontend and any Vercel preview deployment.
    if (protocol === 'https:' && hostname.endsWith('.vercel.app')) return true
  } catch {
    return false
  }
  return false
}

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true)
      const error = new Error('Origin is not allowed by CORS.')
      error.status = 403
      return callback(error)
    },
  }))
  app.use(express.json({ limit: '20kb' }))
  app.use('/api', rateLimit)
  app.get('/health', (_request, response) => response.json({ status: 'ok', model: config.geminiModel, configured: config.geminiKeys.length > 0 }))
  app.use('/api/grammar', grammarRouter)
  app.use('/api/reading', readingRouter)
  app.use((error, _request, response, _next) => {
    console.error(error.message)
    const status = Number.isInteger(error.status) && error.status >= 400 ? error.status : 500
    const message = status === 500 ? 'The tutor could not complete that request. Please try again.' : error.message
    response.status(status).json({ error: message })
  })
  return app
}
