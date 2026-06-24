import { useEffect, useRef, useState } from 'react'
import SignWelcome from './SignWelcome.jsx'

// First-run narrative. This both onboards the learner and plants SignBridge's
// core thesis: written English is a SECOND language for ASL-first Deaf learners.
const STEPS = [
  {
    eyebrow: 'Why SignBridge',
    title: (<>reading is taught <span>wrong</span> for Deaf learners.</>),
    body: 'In some regions, three in four Deaf adults read below grade level. Not because they cannot learn — but because written English is taught as if it were their first language. It is not.',
  },
  {
    eyebrow: 'The bridge',
    title: (<>your first language is <span>ASL</span>.</>),
    body: 'ASL has its own grammar: different word order, no articles, time-words instead of verb endings. Writing English means crossing into a second language. SignBridge builds that bridge, one pattern at a time.',
  },
  {
    eyebrow: 'How it works',
    title: (<>write your way. <span>we adapt.</span></>),
    steps: [
      'Write a sentence the way you would sign it.',
      'The agent maps TIME, PERSON, ACTION, OBJECT, and PLACE as visual cards.',
      'Rebuild the same idea in written-English structure.',
      'SignBridge remembers the misconception and chooses your next route.',
    ],
  },
  {
    eyebrow: 'One toolkit',
    title: (<>write, read, and <span>sign</span>.</>),
    steps: [
      'Grammar Bridge — diagnose and practice one skill at a time.',
      'Read & Decode — leveled, illustrated stories, or your own PDF.',
      'Fingerspell — practice the manual alphabet live on camera.',
      'Teacher view — track mastery and export a progress report.',
    ],
  },
]

export default function Onboarding({ onClose }) {
  const [index, setIndex] = useState(0)
  const panelRef = useRef(null)
  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight' && !isLast) setIndex((value) => value + 1)
      else if (event.key === 'ArrowLeft' && index > 0) setIndex((value) => value - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, isLast, onClose])

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding__panel" ref={panelRef} tabIndex={-1}>
        <div className="onboarding__bar">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
          <strong>SignBridge</strong>
          <button className="onboarding__skip" onClick={onClose}>Skip intro</button>
        </div>

        <div className="onboarding__body">
          <p className="eyebrow">{step.eyebrow}</p>
          <h2 id="onboarding-title">{step.title}</h2>
          {step.body && <p className="onboarding__text">{step.body}</p>}
          {index === 0 && <SignWelcome />}
          {step.steps && (
            <ol className="onboarding__steps">
              {step.steps.map((item, itemIndex) => (
                <li key={item}><span>{String(itemIndex + 1).padStart(2, '0')}</span>{item}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="onboarding__footer">
          <div className="onboarding__dots" aria-hidden="true">
            {STEPS.map((entry, dotIndex) => <i key={entry.eyebrow} className={dotIndex === index ? 'is-active' : ''} />)}
          </div>
          <div className="onboarding__actions">
            {index > 0 && <button className="button" onClick={() => setIndex((value) => value - 1)}>Back</button>}
            {isLast
              ? <button className="button button--primary" onClick={onClose}>Start learning <b aria-hidden="true">-&gt;</b></button>
              : <button className="button button--primary" onClick={() => setIndex((value) => value + 1)}>Next <b aria-hidden="true">-&gt;</b></button>}
          </div>
        </div>
      </div>
    </div>
  )
}
