import { useState } from 'react'
import { useAccessibilityPreferences } from './useAccessibilityPreferences.js'
import { usePwaStatus } from './usePwaStatus.js'

const ACTIVITIES = [
  { id: 'bridge', index: '01', label: 'Grammar bridge', shortLabel: 'Write', ready: true },
  { id: 'read', index: '02', label: 'Read & decode', shortLabel: 'Read', ready: true },
  { id: 'fingerspell', index: '03', label: 'Fingerspell', shortLabel: 'Sign', ready: true },
  { id: 'teacher', index: '04', label: 'Teacher view', shortLabel: 'Teach', ready: true },
]

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i />
    </span>
  )
}

function A11yButton({ active = false, children, label, onClick }) {
  return (
    <button className={`utility-button ${active ? 'is-active' : ''}`} onClick={onClick} aria-label={label} aria-pressed={active} title={label}>
      {children}
    </button>
  )
}

export default function AppShell({ activeActivity, onActivityChange, onShowIntro, children }) {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const preferences = useAccessibilityPreferences()
  const pwa = usePwaStatus()

  return (
    <div className="site-frame">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SignBridge home">
          <BrandMark />
          <span>
            <strong>SignBridge</strong>
            <small>from sign to sentence</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Learning activities">
          {ACTIVITIES.map((activity) => (
            <button
              key={activity.id}
              className={activeActivity === activity.id ? 'is-active' : ''}
              onClick={() => activity.ready && onActivityChange(activity.id)}
              disabled={!activity.ready}
            >
              {activity.label}
              {!activity.ready && <sup>soon</sup>}
            </button>
          ))}
        </nav>

        <div className="topbar__actions">
          <span className={`model-status ${pwa.online ? '' : 'is-offline'}`} role="status">
            <i /> {pwa.online ? 'AI tutor ready' : 'Offline lessons ready'}
          </span>
          {pwa.canInstall && <button className="install-trigger" onClick={pwa.install}>Install app</button>}
          {onShowIntro && <button className="intro-trigger" onClick={onShowIntro}>Intro</button>}
          <button className="accessibility-trigger" onClick={() => setAccessibilityOpen((open) => !open)} aria-expanded={accessibilityOpen}>
            Accessibility <span aria-hidden="true">{accessibilityOpen ? '−' : '+'}</span>
          </button>
        </div>
      </header>

      {accessibilityOpen && (
        <div className="accessibility-tray" role="group" aria-label="Accessibility preferences">
          <span>Reading display</span>
          <A11yButton active={preferences.dyslexic} onClick={preferences.toggleDyslexic} label="Toggle dyslexia-friendly font">Dyslexic</A11yButton>
          <A11yButton onClick={preferences.decreaseScale} label="Decrease text size">A−</A11yButton>
          <A11yButton onClick={preferences.increaseScale} label="Increase text size">A+</A11yButton>
          <A11yButton active={preferences.contrast} onClick={preferences.toggleContrast} label="Toggle high contrast">Contrast</A11yButton>
        </div>
      )}

      <nav className="activity-rail" aria-label="Learning activities">
        {ACTIVITIES.map((activity) => (
          <button
            key={activity.id}
            className={activeActivity === activity.id ? 'is-active' : ''}
            onClick={() => activity.ready && onActivityChange(activity.id)}
            disabled={!activity.ready}
          >
            <span>{activity.index}</span>
            <strong>{activity.shortLabel}</strong>
            <small>{activity.ready ? activity.label : 'Coming soon'}</small>
          </button>
        ))}
      </nav>

      <main id="top">{children}</main>

      <footer className="site-footer">
        <div>
          <BrandMark />
          <p><strong>SignBridge</strong><br />A bilingual literacy workspace for Deaf learners.</p>
        </div>
        <p>Built for access. Designed for learning.<br /><span>{pwa.offlineReady ? 'Offline-ready PWA' : 'EdTech 3.0 / Track 03'}</span></p>
      </footer>
    </div>
  )
}
