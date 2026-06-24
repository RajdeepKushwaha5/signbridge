import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { Panel, SectionTitle } from '../../shared/components/Panel.jsx'
import { bridgeSentence, checkPractice } from './grammar.service.js'
import { exportProfile, getProfile, getProfileSummary, getSkillsInFocus, importProfile, recordAssessment, recordDiagnosisObservation, recordSession, resetProfile } from './grammar.store.js'
import { initialSession, restoreSession, SESSION_KEY, sessionReducer } from './sessionMachine.js'
import { chooseNextAction } from './agentPolicy.js'
import { EXAMPLES } from './examples.js'
import { getStreak, pickNewMilestones, recordActivity, resetProgress } from '../progress/progress.js'

const STAGES = ['input', 'diagnosis', 'concept', 'lesson', 'guided', 'transfer', 'summary']

export default function GrammarBridge({ onNavigate }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, restoreSession)
  const [text, setText] = useState(session.sentence || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(getProfile())
  const [summaryExtras, setSummaryExtras] = useState({ streak: null, milestones: [] })

  useEffect(() => {
    if (session.stage === 'input') sessionStorage.removeItem(SESSION_KEY)
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  async function diagnose(sentence) {
    const value = (sentence ?? text).trim()
    if (!value || loading) return
    setText(value)
    setLoading(true)
    setError('')
    try {
      const diagnosis = await bridgeSentence(value, getProfileSummary())
      if (diagnosis.hasErrors) {
        setProfile(recordDiagnosisObservation({ skillId: diagnosis.focusSkill.id, phase: 'diagnosis', learnerText: value }))
      }
      dispatch({ type: 'DIAGNOSIS_READY', sentence: value, diagnosis })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function startNewSession() {
    setText('')
    setError('')
    dispatch({ type: 'RESET' })
  }

  function focusComposer() {
    const composer = document.getElementById('sentence')
    composer?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    composer?.focus({ preventScroll: true })
  }

  const hasProgress = profile.sessions.length > 0 || Object.values(profile.skills).some((skill) => skill.attempts > 0)

  return (
    <div className="feature-page grammar-page">
      <section className="feature-hero feature-hero--compact">
        <div className="grammar-hero__content">
          <SectionTitle
            eyebrow="AI writing tutor for Deaf, ASL-first learners"
            title={<><span>write it your way.</span> see how English changes.</>}
            description="SignBridge detects ASL-to-English language transfer, explains one useful pattern, and proves learning with an unseen sentence."
          />
          <ol className="hero-process" aria-label="How the SignBridge agent works">
            {['Diagnose', 'Explain', 'Rewrite', 'Transfer', 'Remember'].map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
          </ol>
          {session.stage === 'input' && (
            <div className="hero-actions">
              <button className="button button--primary" onClick={() => diagnose(EXAMPLES[0])} disabled={loading}>{loading ? 'Agent is diagnosing...' : 'Try a live example'} <b aria-hidden="true">-&gt;</b></button>
              <button className="button" onClick={focusComposer}>Write my sentence</button>
              <span className="offline-proof"><i aria-hidden="true" /> Installable · reviewed lessons work offline</span>
            </div>
          )}
        </div>
        {session.stage === 'input' ? <HeroAgentPreview /> : <SessionProgress stage={session.stage} />}
      </section>

      <div className="session-goal" role="note">
        <span>Session goal</span>
        <p>Take one grammar skill from learning to an <strong>independent transfer</strong>.</p>
      </div>

      <div className="workspace-grid">
        <div className="workspace-main">
          {session.stage === 'input' && <InputStage text={text} setText={setText} loading={loading} onSubmit={diagnose} />}
          {session.stage === 'diagnosis' && <DiagnosisStage session={session} onContinue={() => dispatch({ type: 'SHOW_CONCEPT' })} />}
          {session.stage === 'concept' && <ConceptBridgeStage session={session} dispatch={dispatch} onContinue={() => dispatch({ type: 'SHOW_LESSON' })} />}
          {session.stage === 'lesson' && <LessonStage diagnosis={session.diagnosis} onContinue={() => dispatch({ type: 'START_GUIDED' })} />}
          {session.stage === 'guided' && (
            <PracticeStage phase="guided" session={session} dispatch={dispatch} setProfile={setProfile} onNavigate={onNavigate} onAdvance={() => dispatch({ type: 'START_TRANSFER' })} />
          )}
          {session.stage === 'transfer' && (
            <PracticeStage phase="transfer" session={session} dispatch={dispatch} setProfile={setProfile} onNavigate={onNavigate} onAdvance={() => {
              const updated = recordSession({
                id: `session-${session.startedAt}`,
                skillId: session.diagnosis.focusSkill.id,
                sentence: session.sentence,
                guidedCorrect: Boolean(session.guided.result?.correct),
                guidedHints: session.guided.hintLevel,
                transferCorrect: Boolean(session.transfer.result?.correct),
                transferHints: session.transfer.hintLevel,
                durationMs: Date.now() - session.startedAt,
                mode: session.diagnosis.mode,
                decisions: session.decisions,
                nextAction: session.nextAction?.id || null,
              })
              setProfile(updated)
              const streak = recordActivity()
              setSummaryExtras({ streak, milestones: pickNewMilestones(updated, streak) })
              dispatch({ type: 'SHOW_SUMMARY' })
            }} />
          )}
          {session.stage === 'summary' && <SummaryStage session={session} profile={profile} extras={summaryExtras} onRestart={startNewSession} onNavigate={onNavigate} onReviewBridge={() => dispatch({ type: 'SHOW_CONCEPT' })} />}

          {error && <div className="notice notice--error" role="alert"><strong>Request paused</strong>{error}</div>}
          {session.diagnosis?.mode === 'fallback' && session.stage !== 'input' && (
            <div className="notice" role="status"><strong>Reliable practice mode</strong>The live AI was unavailable, so SignBridge loaded a reviewed built-in lesson. Your progress still counts.</div>
          )}
        </div>

        <aside className="workspace-aside">
          <AgentTimeline decisions={session.decisions} />
          <MemoryPanel profile={profile} />
          {hasProgress && <MasteryPanel profile={profile} onProfileChange={setProfile} />}
          {profile.sessions.length > 0 && <StreakChip />}
          <JourneyPanel stage={session.stage} />
        </aside>
      </div>
    </div>
  )
}

function HeroAgentPreview() {
  return (
    <aside className="hero-agent-preview" aria-label="What the SignBridge agent will do">
      <div><span>AI agent preview</span><strong>Before you start</strong></div>
      <ol>
        <li><span>01</span><p><strong>Map meaning</strong>Find TIME, PERSON, ACTION, OBJECT, and PLACE.</p></li>
        <li><span>02</span><p><strong>Use memory</strong>Compare this sentence with patterns you practiced before.</p></li>
        <li><span>03</span><p><strong>Choose a route</strong>Adapt the next explanation, scaffold, or challenge.</p></li>
      </ol>
    </aside>
  )
}

function SessionProgress({ stage }) {
  const activeIndex = STAGES.indexOf(stage)
  return (
    <div className="session-progress" aria-label={`Session step ${activeIndex + 1} of ${STAGES.length}`}>
      <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
      <div><span>{stage.replace('_', ' ')}</span><progress value={activeIndex + 1} max={STAGES.length} /></div>
    </div>
  )
}

function InputStage({ text, setText, loading, onSubmit }) {
  return (
    <>
      <Panel label="Sentence workspace" meta={loading ? 'Tutor thinking' : 'Ready'}>
        <div className="composer">
          <label htmlFor="sentence">Write it your way</label>
          <textarea id="sentence" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) onSubmit()
          }} rows={5} maxLength={400} placeholder="Store I go yesterday." />
          <div className="composer__footer">
            <span>{text.length.toString().padStart(3, '0')} / 400</span><span>Ctrl + Enter</span>
            <button className="button button--primary" onClick={() => onSubmit()} disabled={loading || !text.trim()}>{loading ? 'Choosing next skill...' : 'Start my session'} <b aria-hidden="true">-&gt;</b></button>
          </div>
        </div>
      </Panel>
      <section className="examples" aria-labelledby="examples-title">
        <div className="subsection-heading"><h3 id="examples-title">Try an example</h3><span>ASL-influenced English</span></div>
        <div className="example-grid">{EXAMPLES.map((example, index) => <button key={example} onClick={() => onSubmit(example)} disabled={loading}><span>{String(index + 1).padStart(2, '0')}</span>{example}<b aria-hidden="true">-&gt;</b></button>)}</div>
      </section>
      <BridgePatterns />
    </>
  )
}

const BRIDGE_PATTERNS = [
  { from: 'Topic / place first', to: 'English subject first', example: 'Store I go → I go to the store' },
  { from: 'Time word, no tense change', to: 'English verb tense', example: 'go yesterday → went yesterday' },
  { from: 'No article', to: 'a / an / the', example: 'book is mine → the book is mine' },
  { from: 'Place idea', to: 'English preposition', example: 'go store → go to the store' },
  { from: 'Description without “is”', to: 'English “to be”', example: 'she happy → she is happy' },
  { from: 'One subject', to: 'verb + s', example: 'she play → she plays' },
  { from: 'More than one', to: 'plural -s', example: 'three cat → three cats' },
]

function BridgePatterns() {
  return (
    <section className="bridge-patterns" aria-labelledby="patterns-title">
      <div className="subsection-heading"><h3 id="patterns-title">Bridge patterns</h3><span>sign-influenced → written English</span></div>
      <p className="bridge-patterns__intro">SignBridge is built on a contrastive learning model, not generic grammar correction. These are the language-transfer patterns it teaches.</p>
      <ul className="bridge-patterns__list">
        {BRIDGE_PATTERNS.map((pattern) => (
          <li key={pattern.from}>
            <div><strong>{pattern.from}</strong><b aria-hidden="true">→</b><strong>{pattern.to}</strong></div>
            <small>{pattern.example}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DiagnosisStage({ session, onContinue }) {
  const result = session.diagnosis
  const focusId = result.focusSkill.id
  const otherSkills = [...new Map(result.errors.filter((item) => item.skillId !== focusId).map((item) => [item.skillId, item])).values()]
  return (
    <div className="stage-stack" aria-live="polite">
      <div className="subsection-heading"><h3>Diagnosis complete</h3><span>{Math.round(result.confidence * 100)}% confidence</span></div>
      <div className="sentence-comparison"><div><span>You wrote</span><p>{session.sentence}</p></div><div><span>Clear written English</span><p>{result.corrected}</p></div></div>
      <Panel label="Agent decision" meta={result.focusSkill.label}>
        <div className="agent-decision">
          <span>Focus skill</span>
          <h3>{result.focusSkill.label}</h3>
          <details className="agent-why" open>
            <summary>Why did the tutor choose this skill?</summary>
            <p>{result.decisionReason}</p>
            <ul className="agent-why__facts">
              <li>Confidence <strong>{Math.round(result.confidence * 100)}%</strong></li>
              <li>Patterns found in your sentence <strong>{result.errors.length}</strong></li>
              <li>Selected as the highest-value next step{result.mode === 'fallback' ? ' (reviewed offline lesson)' : ''}.</li>
            </ul>
          </details>
        </div>
      </Panel>
      {otherSkills.length > 0 && (
        <div className="agent-also">
          <span>Also noticed — not teaching yet</span>
          <p>{otherSkills.map((item) => item.label).join(', ')}. The agent is teaching <strong>{result.focusSkill.label}</strong> first because it gives the fastest useful improvement.</p>
        </div>
      )}
      <div className="learning-notes">{result.errors.map((item, index) => <article key={`${item.skillId}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><h4>{item.label}</h4><p>{item.explanation}</p><small>Remember / {item.tip}</small></div></article>)}</div>
      <StageAction label="Open the visual concept bridge" detail="See what stays, changes, and moves" onClick={onContinue} />
    </div>
  )
}

function ConceptCard({ card, transformed = false, controls = null }) {
  return (
    <article data-card-id={card.id} className={`concept-card role-${card.role.toLowerCase()} ${transformed && card.changed ? 'is-changed' : ''}`}>
      <span>{card.role}</span>
      <strong>{transformed ? card.englishText : card.learnerText}</strong>
      {transformed && card.changed && <small>changed for written English</small>}
      {controls}
    </article>
  )
}

function ConceptBridgeStage({ session, dispatch, onContinue }) {
  const bridge = session.diagnosis.conceptBridge
  const cards = Object.fromEntries(bridge.cards.map((card) => [card.id, card]))
  const concept = session.concept
  const terminal = concept.correct || concept.revealed

  // FLIP animation: when the card order changes (a move, or the agent revealing
  // the answer), each card glides from its old position to its new one.
  const targetRef = useRef(null)
  const positions = useRef({})
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    const track = targetRef.current
    if (!track || reduceMotion) return
    const nodes = Array.from(track.querySelectorAll('[data-card-id]'))
    const next = {}
    nodes.forEach((node) => {
      const id = node.getAttribute('data-card-id')
      const rect = node.getBoundingClientRect()
      next[id] = rect
      const prev = positions.current[id]
      if (prev) {
        const dx = prev.left - rect.left
        const dy = prev.top - rect.top
        if (dx || dy) {
          node.style.transition = 'none'
          node.style.transform = `translate(${dx}px, ${dy}px)`
          requestAnimationFrame(() => {
            node.style.transition = 'transform 380ms cubic-bezier(.2, .8, .2, 1)'
            node.style.transform = ''
          })
        }
      }
    })
    positions.current = next
  }, [concept.order, terminal, reduceMotion])

  return (
    <div className="stage-stack concept-stage" aria-live="polite">
      <div className="subsection-heading"><h3>Visual concept bridge</h3><span>{bridge.cards.length} meaning roles</span></div>
      <p className="concept-intro">There is no single universal ASL order. These cards show how <strong>your sentence</strong> carries meaning and how written English organizes the same idea.</p>
      <ReviewBadge />

      <Panel label="Your thought structure" meta="meaning preserved">
        <div className="concept-track concept-track--source">
          {bridge.learnerOrder.map((id) => <ConceptCard key={id} card={cards[id]} />)}
        </div>
      </Panel>

      <div className="concept-transform" aria-hidden="true"><span>same idea</span><b>↓</b><span>written English</span></div>

      <Panel label="Build the written-English structure" meta={`Try ${Math.max(1, concept.attempts + 1)}`}>
        <div ref={targetRef} className={`concept-track concept-track--target ${terminal ? 'is-complete' : ''}`}>
          {concept.order.map((id, index) => {
            const controls = !terminal ? (
              <div className="concept-card__controls">
                <button onClick={() => dispatch({ type: 'MOVE_CONCEPT', id, direction: -1 })} disabled={index === 0} aria-label={`Move ${cards[id].englishText} left`}>←</button>
                <button onClick={() => dispatch({ type: 'MOVE_CONCEPT', id, direction: 1 })} disabled={index === concept.order.length - 1} aria-label={`Move ${cards[id].englishText} right`}>→</button>
              </div>
            ) : null
            return <ConceptCard key={id} card={cards[id]} transformed controls={controls} />
          })}
        </div>
        <div className="concept-checkbar">
          <p>{bridge.summary}</p>
          {!terminal && <button className="button button--primary" onClick={() => dispatch({ type: 'CHECK_CONCEPT' })}>Check my bridge <b aria-hidden="true">-&gt;</b></button>}
        </div>
      </Panel>

      {concept.checked && !concept.correct && !concept.revealed && (
        <div className="practice-feedback needs-retry">
          <span>Agent route / visual explanation</span>
          <h3>The meaning is here. One or more concept cards need a different position.</h3>
          <p><strong>Why /</strong> Compare the role labels, then move PERSON, ACTION, OBJECT, and PLACE into a clear written-English path.</p>
          <button className="button" onClick={() => dispatch({ type: 'REVEAL_CONCEPT' })}>Show the transformation</button>
        </div>
      )}
      {concept.correct && <div className="practice-feedback is-correct"><span>Bridge built</span><h3>You preserved the idea and rebuilt its written-English structure.</h3></div>}
      {concept.revealed && <div className="practice-feedback"><span>Visual support</span><h3>The agent arranged the roles so you can compare the two structures directly.</h3></div>}
      {terminal && <StageAction label="Learn the language change" detail="The agent chose one reusable rule from this bridge" onClick={onContinue} />}
    </div>
  )
}

function LessonStage({ diagnosis, onContinue }) {
  return (
    <div className="stage-stack">
      <Panel label="Mini lesson" meta={diagnosis.focusSkill.label}>
        <div className="mini-lesson"><p>One idea to carry forward</p><h3>{diagnosis.lesson.title}</h3><blockquote>{diagnosis.lesson.rule}</blockquote><div>{diagnosis.lesson.explanation}</div></div>
      </Panel>
      <StageAction label="Try a guided rewrite" detail="You can ask for two graduated hints" onClick={onContinue} />
    </div>
  )
}

function PracticeStage({ phase, session, dispatch, setProfile, onAdvance, onNavigate }) {
  const state = session[phase]
  const practice = phase === 'guided' ? session.diagnosis.guidedPractice : session.diagnosis.transferPractice
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const isMasteryChallenge = phase === 'transfer' && session.nextAction?.id === 'mastery_challenge'

  async function submit() {
    if (!state.answer.trim() || checking) return
    setChecking(true)
    setError('')
    try {
      const result = await checkPractice({ phase, skillId: session.diagnosis.focusSkill.id, learnerAnswer: state.answer, practice, attempt: state.attempt })
      const assessment = recordAssessment({ skillId: session.diagnosis.focusSkill.id, phase, correct: result.correct, hintLevel: state.hintLevel, learnerAnswer: state.answer })
      const nextAction = chooseNextAction({ phase, correct: result.correct, shouldAdvance: result.shouldAdvance, hintLevel: state.hintLevel, masteryBefore: assessment.before, masteryAfter: assessment.after })
      setProfile(assessment.profile)
      const decisionDetail = nextAction.id === 'another_scaffold'
        ? `Attempt ${state.attempt} needs one more reusable cue before the learner retries.`
        : nextAction.id === 'unseen_transfer'
          ? 'The guided rewrite is secure enough to test with a genuinely different sentence.'
          : nextAction.id === 'mastery_challenge'
            ? `Independent performance reached ${assessment.after}% mastery, so the agent raised the challenge.`
            : nextAction.id === 'reading_reinforcement'
              ? 'The learner will benefit from seeing the same pattern in meaningful reading context.'
              : 'The response shows that the concept contrast should be made visible again.'
      dispatch({ type: 'PRACTICE_RESULT', phase, result, assessment, nextAction, decisionDetail })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setChecking(false)
    }
  }

  const terminal = state.result?.shouldAdvance
  return (
    <div className="stage-stack" aria-live="polite">
      <Panel label={phase === 'guided' ? 'Guided rewrite' : isMasteryChallenge ? 'Mastery challenge' : 'Unseen transfer'} meta={`Attempt ${state.attempt} / 3`}>
        <div className="practice-card">
          <p className="practice-card__purpose">{phase === 'guided' ? 'Practice the rule you just learned.' : isMasteryChallenge ? 'Your independent work is strong. Prove the pattern without a copied example.' : 'Prove you can use the skill in a new sentence.'}</p>
          <h3>{practice.prompt}</h3>
          <label htmlFor={`${phase}-answer`}>{practice.instruction}</label>
          <textarea id={`${phase}-answer`} rows={4} maxLength={500} value={state.answer} disabled={Boolean(state.result)} onChange={(event) => dispatch({ type: 'SET_ANSWER', phase, answer: event.target.value })} />
          {!state.result && <button className="button button--primary" onClick={submit} disabled={checking || !state.answer.trim()}>{checking ? 'Checking meaning...' : 'Check my rewrite'} <b aria-hidden="true">-&gt;</b></button>}
        </div>
      </Panel>

      {state.result && (
        <div className={`practice-feedback ${state.result.correct ? 'is-correct' : 'needs-retry'}`}>
          <span>{state.result.correct ? 'Correct' : state.result.status === 'needs_support' ? 'Model support' : `Hint ${state.hintLevel}`}</span>
          <h3>{state.result.feedback}</h3>
          {state.result.hint && <p><strong>Try this /</strong> {state.result.hint}</p>}
          {state.result.modelAnswer && <p><strong>Model answer /</strong> {state.result.modelAnswer}</p>}
          <small>Mastery {state.assessment.before}% → {state.assessment.after}% ({state.assessment.delta >= 0 ? '+' : ''}{state.assessment.delta})</small>
          {state.assessment.insight && <p className="memory-insight"><strong>Agent memory /</strong> {state.assessment.insight}</p>}
        </div>
      )}

      {state.result && session.nextAction && (
        <div className="agent-route"><span>Agent chose next</span><strong>{session.nextAction.label}</strong><p>{session.nextAction.description}</p></div>
      )}

      {error && <div className="notice notice--error"><strong>Check paused</strong>{error}</div>}
      {state.result && !terminal && <StageAction label="Rewrite and try again" detail={`Attempt ${state.attempt + 1} will unlock the next hint`} onClick={() => dispatch({ type: 'RETRY', phase })} />}
      {terminal && phase === 'guided' && session.nextAction?.id === 'reading_reinforcement' && <button className="stage-action stage-action--secondary" onClick={() => onNavigate?.('read')}><span><strong>Practice this pattern in reading</strong><small>The agent recommends context before a harder transfer</small></span><b aria-hidden="true">-&gt;</b></button>}
      {terminal && <StageAction label={phase === 'guided' ? 'Try the unseen transfer' : 'Finish this session'} detail={phase === 'guided' ? 'A different sentence tests independent use' : 'Save progress and view your summary'} onClick={onAdvance} />}
    </div>
  )
}

function SummaryStage({ session, profile, extras, onRestart, onNavigate, onReviewBridge }) {
  const skill = profile.skills[session.diagnosis.focusSkill.id]
  const elapsed = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
  const goalMet = Boolean(session.transfer.result?.correct)
  const streak = extras?.streak
  const milestones = extras?.milestones || []
  return (
    <div className="stage-stack">
      <div className={`session-goal session-goal--result ${goalMet ? 'is-met' : ''}`} role="status">
        <span>{goalMet ? 'Goal met' : 'Goal in progress'}</span>
        <p>{goalMet ? 'You used the new skill in a brand-new sentence — that is real learning.' : 'You finished the session. Try another to reach an independent transfer.'}</p>
      </div>
      <Panel label="Learning proof" meta={`${elapsed} min`}>
        <div className="session-summary">
          <div className="proof-journey">
            <div><span>You wrote</span><p>{session.sentence}</p></div>
            <div><span>Clear written English</span><p>{session.diagnosis.corrected}</p></div>
          </div>
          <p>Skill practiced</p><h3>{skill.label}</h3>
          <div className="summary-metrics"><div><strong>{skill.mastery}%</strong><span>mastery</span></div><div><strong>{session.guided.result?.correct ? 'yes' : 'with help'}</strong><span>guided rewrite</span></div><div><strong>{goalMet ? 'yes' : 'not yet'}</strong><span>unseen transfer</span></div></div>
          <p className="next-review"><strong>Next review /</strong> {new Date(skill.nextReview).toLocaleDateString()}</p>
        </div>
      </Panel>
      <ReviewBadge />
      {profile.insights[0] && <div className="memory-callout"><span>What the agent remembered</span><p>{profile.insights[0].message}</p></div>}
      {session.nextAction && (
        <div className="agent-route agent-route--summary"><span>Recommended next route</span><strong>{session.nextAction.label}</strong><p>{session.nextAction.description}</p>
          {session.nextAction.id === 'reading_reinforcement' && <button className="button" onClick={() => onNavigate?.('read')}>Open Read &amp; decode</button>}
          {session.nextAction.id === 'visual_explanation' && <button className="button" onClick={onReviewBridge}>Review the visual bridge</button>}
        </div>
      )}
      {streak?.current > 0 && (
        <div className="streak-banner"><strong>{streak.current}-day streak</strong><span>best {streak.best} · keep it going</span></div>
      )}
      {milestones.length > 0 && (
        <div className="milestone-burst">
          {milestones.map((milestone) => <span key={milestone.id}>🏅 {milestone.label}</span>)}
        </div>
      )}
      <StageAction label="Start another session" detail="The agent will choose the next useful skill" onClick={onRestart} />
    </div>
  )
}

function ReviewBadge() {
  return (
    <div className="review-badge" role="note">
      <span>Pending Deaf-educator review</span>
      <p>The concept cards are contrastive learning aids — not a claim about a single universal sign-language word order.</p>
    </div>
  )
}

function MemoryPanel({ profile }) {
  const memories = Object.values(profile.skills).flatMap((skill) => skill.misconceptions.map((memory) => ({ ...memory, skill: skill.label }))).sort((a, b) => (b.lastObserved || '').localeCompare(a.lastObserved || '')).slice(0, 3)
  return (
    <Panel label="Agent memory" meta={`${memories.length} active patterns`}>
      <div className="memory-panel">
        {profile.insights[0] && <p className="memory-panel__insight">{profile.insights[0].message}</p>}
        {memories.length === 0 ? <p className="memory-panel__empty">The agent will remember useful language patterns, not personal identity.</p> : <ul>{memories.map((memory) => <li key={memory.id}><strong>{memory.skill}</strong><span>{memory.description}</span><small>{memory.occurrences} observed · {memory.resolutions} independently resolved</small></li>)}</ul>}
      </div>
    </Panel>
  )
}

function AgentTimeline({ decisions }) {
  return (
    <Panel label={decisions.length ? 'Agent decision timeline' : 'Agent preview'} meta={decisions.length ? `${decisions.length} decisions` : 'what AI will do'}>
      <ol className="decision-timeline">
        {decisions.length === 0
          ? <>
              <li className="is-empty"><span>01</span><p><strong>Observe</strong>Map meaning roles without judging ASL.</p></li>
              <li className="is-empty"><span>02</span><p><strong>Personalize</strong>Check mastery and misconception memory.</p></li>
              <li className="is-empty"><span>03</span><p><strong>Act</strong>Choose the next useful learning route.</p></li>
            </>
          : decisions.map((decision, index) => <li key={decision.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{decision.label}</strong><p>{decision.detail}</p></div></li>)}
      </ol>
    </Panel>
  )
}

function StreakChip() {
  const streak = getStreak()
  return (
    <Panel label="Streak" meta={`best ${streak.best || 0}`}>
      <div className="streak-chip">
        <strong>{streak.current || 0}</strong>
        <span>day{streak.current === 1 ? '' : 's'} in a row</span>
      </div>
    </Panel>
  )
}

function StageAction({ label, detail, onClick }) {
  return <button className="stage-action" onClick={onClick}><span><strong>{label}</strong><small>{detail}</small></span><b aria-hidden="true">-&gt;</b></button>
}

function JourneyPanel({ stage }) {
  const current = STAGES.indexOf(stage)
  return <Panel label="Tutor journey" meta={`${current + 1} / ${STAGES.length}`}><ol className="journey-list">{STAGES.map((item, index) => <li key={item} className={index === current ? 'is-current' : index < current ? 'is-complete' : ''}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol></Panel>
}

function MasteryPanel({ profile, onProfileChange }) {
  const fileRef = useRef(null)
  const skills = getSkillsInFocus()

  function downloadProfile() {
    const url = URL.createObjectURL(new Blob([exportProfile()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'signbridge-profile.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function uploadProfile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      onProfileChange(importProfile(await file.text()))
    } catch (error) {
      window.alert(error.message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <Panel label="Learner mastery" meta={`${profile.sessions.length} sessions`}>
      <div className="mastery-panel">
        {skills.length === 0 ? <div className="empty-state"><span>--</span><p>Complete a practice check<br />to begin your mastery map.</p></div> : <ul>{skills.map((skill) => <li key={skill.id}><div><strong>{skill.label}</strong><span>{skill.mastered ? 'mastered' : 'learning'}</span></div><progress value={skill.mastery} max="100" /><small>{skill.mastery}%</small></li>)}</ul>}
        <div className="profile-actions"><button onClick={downloadProfile}>Export</button><button onClick={() => fileRef.current?.click()}>Import</button><button onClick={() => { if (window.confirm('Reset all local SignBridge progress?')) { resetProgress(); onProfileChange(resetProfile()) } }}>Reset</button><input ref={fileRef} type="file" accept="application/json" onChange={uploadProfile} hidden /></div>
      </div>
    </Panel>
  )
}
