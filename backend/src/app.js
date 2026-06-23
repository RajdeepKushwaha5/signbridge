import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import grammarRouter from './features/grammar.js'
import readingRouter from './features/reading.js'
import { rateLimit } from './middleware/rateLimit.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true)
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
