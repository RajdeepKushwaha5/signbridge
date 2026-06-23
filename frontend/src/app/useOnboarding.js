import { useState } from 'react'

const KEY = 'signbridge.onboarding.seen.v1'

// Tracks whether the learner has seen the first-run introduction.
export function useOnboarding() {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'true'
    } catch {
      return false
    }
  })

  function markSeen() {
    try {
      localStorage.setItem(KEY, 'true')
    } catch {
      /* ignore storage failures */
    }
    setSeen(true)
  }

  return { seen, markSeen }
}
