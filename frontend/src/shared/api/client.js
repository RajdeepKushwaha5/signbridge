const environment = import.meta.env || {}
const apiBaseUrl = (environment.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')

export function createApiClient({ baseUrl = apiBaseUrl, fetchImpl = fetch, timeoutMs = 30_000 } = {}) {
  return async function request(path, payload) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}.`)
      return data
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The tutor took too long to respond. Please try again.')
      if (error instanceof TypeError) throw new Error('The tutor service is unavailable. Check the backend connection and try again.')
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }
}

export const postJSON = createApiClient()
