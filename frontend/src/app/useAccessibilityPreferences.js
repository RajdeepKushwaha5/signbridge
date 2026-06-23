import { useEffect, useState } from 'react'

function useStoredPreference(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export function useAccessibilityPreferences() {
  const [dyslexic, setDyslexic] = useStoredPreference('signbridge.dyslexic', false)
  const [contrast, setContrast] = useStoredPreference('signbridge.contrast', false)
  const [scale, setScale] = useStoredPreference('signbridge.scale', 1)

  useEffect(() => {
    document.body.classList.toggle('dyslexic', dyslexic)
    document.body.classList.toggle('contrast', contrast)
    document.documentElement.style.setProperty('--text-scale', String(scale))
  }, [contrast, dyslexic, scale])

  return {
    contrast,
    dyslexic,
    scale,
    toggleContrast: () => setContrast((value) => !value),
    toggleDyslexic: () => setDyslexic((value) => !value),
    decreaseScale: () => setScale((value) => Math.max(0.9, +(value - 0.1).toFixed(2))),
    increaseScale: () => setScale((value) => Math.min(1.4, +(value + 0.1).toFixed(2))),
  }
}
