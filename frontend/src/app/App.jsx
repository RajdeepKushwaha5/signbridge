import { useEffect, useState } from 'react'
import AppShell from './AppShell.jsx'
import Onboarding from './Onboarding.jsx'
import { useOnboarding } from './useOnboarding.js'
import GrammarBridge from '../features/grammar/GrammarBridge.jsx'
import ReadDecode from '../features/reading/ReadDecode.jsx'
import Fingerspell from '../features/fingerspell/Fingerspell.jsx'
import TeacherView from '../features/teacher/TeacherView.jsx'
import { warmBackend } from '../shared/api/client.js'

export default function App() {
  const [activity, setActivity] = useState('bridge')
  const [fingerspellWord, setFingerspellWord] = useState(null)
  const { seen, markSeen } = useOnboarding()
  const [introOpen, setIntroOpen] = useState(!seen)

  // Warm the backend on load so the first AI request isn't slowed by a cold start.
  useEffect(() => { warmBackend() }, [])

  function closeIntro() {
    markSeen()
    setIntroOpen(false)
  }

  // Hand a vocabulary word from the reading studio over to fingerspell practice.
  function practiceWord(word) {
    setFingerspellWord(word)
    setActivity('fingerspell')
  }

  return (
    <>
      <AppShell activeActivity={activity} onActivityChange={setActivity} onShowIntro={() => setIntroOpen(true)}>
        {activity === 'bridge' && <GrammarBridge onNavigate={setActivity} />}
        {activity === 'read' && <ReadDecode onPracticeWord={practiceWord} />}
        {activity === 'fingerspell' && <Fingerspell initialWord={fingerspellWord} />}
        {activity === 'teacher' && <TeacherView />}
      </AppShell>
      {introOpen && <Onboarding onClose={closeIntro} />}
    </>
  )
}
