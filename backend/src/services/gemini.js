import { config } from '../config.js'

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`
let keyIndex = 0

async function callGemini(key, body) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${endpoint}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    })

    if (response.ok) return response.json()

    if (response.status >= 500 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      continue
    }

    const error = new Error(`Gemini request failed with status ${response.status}`)
    error.status = response.status
    throw error
  }
}

export async function generateStructuredJSON({ system, user, schema, temperature = 0.4 }) {
  if (config.geminiKeys.length === 0) {
    const error = new Error('Gemini is not configured on the server.')
    error.status = 503
    throw error
  }

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  }

  let lastError
  for (let attempt = 0; attempt < config.geminiKeys.length; attempt += 1) {
    const key = config.geminiKeys[keyIndex]
    try {
      const data = await callGemini(key, body)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned an empty response.')
      return JSON.parse(text)
    } catch (error) {
      lastError = error
      if (error.status === 429 || error.status === 403) {
        keyIndex = (keyIndex + 1) % config.geminiKeys.length
        continue
      }
      throw error
    }
  }

  throw lastError
}
