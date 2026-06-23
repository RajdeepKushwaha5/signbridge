import 'dotenv/config'

function list(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiKeys: [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((key) => key && !key.startsWith('your_')),
  allowedOrigins: list(process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'),
}
