const requestsByClient = new Map()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

export function rateLimit(request, response, next) {
  const now = Date.now()
  const key = request.ip || request.socket.remoteAddress || 'unknown'
  const recent = (requestsByClient.get(key) || []).filter((time) => now - time < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    return response.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
  }

  recent.push(now)
  requestsByClient.set(key, recent)
  return next()
}
