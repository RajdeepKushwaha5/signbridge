import { useMemo, useRef, useState } from 'react'
import { Panel, SectionTitle } from '../../shared/components/Panel.jsx'
import { FreeTierNotice } from '../../shared/components/FreeTierNotice.jsx'
import { generateFromText, generatePassage, passageImageUrl, signRefUrl, LEVELS, TOPICS } from './reading.service.js'
import { extractPdfText } from './pdfText.js'
import { getLevel, recordQuiz } from './reading.store.js'
import { getProfileSummary } from '../grammar/grammar.store.js'

// A free AI illustration for the passage. Degrades gracefully: shows a skeleton
// while loading and removes itself if the image service is unavailable, so a
// slow or down image host never breaks the reading experience.
function PassageIllustration({ title }) {
  const [status, setStatus] = useState('loading')
  const src = useMemo(() => passageImageUrl(title), [title])
  if (status === 'error') return null
  return (
    <figure className={`passage-illustration is-${status}`}>
      {status === 'loading' && <span className="passage-illustration__skeleton">Drawing your story…</span>}
      <img
        src={src}
        alt={`Illustration for the story “${title}”`}
        loading="lazy"
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
      />
    </figure>
  )
}

export default function ReadDecode({ onPracticeWord }) {
  const [level, setLevel] = useState(getLevel())
  const [topic, setTopic] = useState(TOPICS[0])
  const [sourceMode, setSourceMode] = useState('topic') // topic | content
  const [sourceText, setSourceText] = useState('')
  const [pdfStatus, setPdfStatus] = useState('idle') // idle | reading | error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passage, setPassage] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [adaptation, setAdaptation] = useState(null)
  const fileRef = useRef(null)

  async function handlePdf(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPdfStatus('reading')
    setError('')
    try {
      const text = await extractPdfText(file)
      if (!text || text.length < 20) {
        setPdfStatus('error')
        return
      }
      setSourceText(text)
      setPdfStatus('idle')
    } catch {
      setPdfStatus('error')
    }
  }

  async function loadPassage(chosenTopic = topic) {
    if (loading) return
    if (sourceMode === 'topic') setTopic(chosenTopic)
    setLoading(true)
    setError('')
    setPassage(null)
    setAnswers({})
    setSubmitted(false)
    setAdaptation(null)

    try {
      const result = sourceMode === 'content'
        ? await generateFromText(level, sourceText, getProfileSummary())
        : await generatePassage(level, chosenTopic, getProfileSummary())
      setPassage(result)
    } catch (requestError) {
      setError(
        requestError.message === 'NO_API_KEY'
          ? 'The live reading service is not configured. SignBridge will use reviewed offline passages when available.'
          : requestError.message,
      )
    } finally {
      setLoading(false)
    }
  }

  function submitQuiz() {
    if (!passage) return
    const total = passage.questions.length
    const correct = passage.questions.reduce(
      (score, question, index) => score + (answers[index] === question.answerIndex ? 1 : 0),
      0,
    )
    const next = recordQuiz(correct, total)
    setLevel(next.level)
    setAdaptation({ correct, total, ...next })
    setSubmitted(true)
  }

  const levelMeta = LEVELS.find((item) => item.n === level) || LEVELS[1]

  return (
    <div className="feature-page">
      <section className="feature-hero">
        <SectionTitle
          eyebrow="02 / Reading studio"
          title={<><span>see the idea.</span> read the story.</>}
          description="Choose a topic. Your reading coach creates a visual passage, unlocks key vocabulary, checks understanding, and adjusts the next level."
        />
        <div className="hero-metric">
          <span>{String(level).padStart(2, '0')}</span>
          <p>current level<br /><strong>{levelMeta.name}</strong><br />adaptive reading</p>
        </div>
      </section>

      <Panel label="Reading setup" meta={`Level ${level} / ${levelMeta.name}`}>
        <div className="source-toggle" role="tablist" aria-label="Reading source">
          <button role="tab" aria-selected={sourceMode === 'topic'} className={sourceMode === 'topic' ? 'is-active' : ''} onClick={() => setSourceMode('topic')} disabled={loading}>AI topic</button>
          <button role="tab" aria-selected={sourceMode === 'content'} className={sourceMode === 'content' ? 'is-active' : ''} onClick={() => setSourceMode('content')} disabled={loading}>My content</button>
        </div>
        <div className="reading-setup">
          {sourceMode === 'topic' ? (
            <div>
              <span className="field-label">Choose a topic</span>
              <div className="topic-grid">
                {TOPICS.map((item, index) => (
                  <button
                    key={item}
                    className={topic === item ? 'is-active' : ''}
                    onClick={() => setTopic(item)}
                    disabled={loading}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>{item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="byoc-input">
              <span className="field-label">Paste text or upload a PDF</span>
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                rows={6}
                maxLength={8000}
                placeholder="Paste a story, worksheet, or article — SignBridge turns it into a leveled, illustrated reading lesson."
                disabled={loading}
              />
              <div className="byoc-input__bar">
                <span>{sourceText.length} / 8000</span>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={loading || pdfStatus === 'reading'}>
                  {pdfStatus === 'reading' ? 'Reading PDF…' : 'Upload PDF'}
                </button>
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={handlePdf} />
              </div>
              {pdfStatus === 'error' && <p className="byoc-error">Could not read that PDF. Try another file, or paste the text directly.</p>}
            </div>
          )}
          <div className="reading-setup__action">
            <p><span>Coach setting</span>{sourceMode === 'content' ? 'Turns your text into a leveled, illustrated lesson.' : levelMeta.hint}</p>
            <button
              className="button button--primary"
              onClick={() => loadPassage()}
              disabled={loading || (sourceMode === 'content' && sourceText.trim().length < 20)}
            >
              {loading
                ? 'Building lesson...'
                : sourceMode === 'content'
                  ? (passage ? 'Rebuild lesson' : 'Create lesson from my text')
                  : (passage ? 'Create another passage' : 'Create my passage')} <b aria-hidden="true">-&gt;</b>
            </button>
          </div>
        </div>
      </Panel>

      {error && <div className="notice notice--error" role="alert"><strong>Request paused</strong>{error}</div>}

      {passage && (
        <div className="reading-workspace">
          {passage.mode === 'fallback' && <FreeTierNotice />}
          {passage.skillFocus && (
            <div className="notice" role="status">
              <strong>Personalized for you</strong>
              This story gives you extra practice with {passage.skillFocus.label} — the skill you are working on in the writing studio.
            </div>
          )}
          <article className="passage-card">
            <PassageIllustration title={passage.title} />
            <div className="passage-card__meta"><span>{passage.source === 'byoc' ? 'From your text' : 'Generated passage'}</span><span>Level {passage.level || level}</span></div>
            <h3>{passage.title}</h3>
            <div className="passage-lines">
              {passage.passage.map((line, index) => <p key={`${line}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{line}</p>)}
            </div>
          </article>

          {passage.keyVocab?.length > 0 && (
          <section className="vocabulary-section">
            <div className="subsection-heading"><h3>Vocabulary decoder</h3><span>03 key concepts</span></div>
            <div className="vocabulary-grid">
              {passage.keyVocab.map((item, index) => (
                <article key={item.word}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h4>{item.word}</h4>
                  <p>{item.meaning}</p>
                  <small>Visual cue / {item.aslTip}</small>
                  <div className="vocab-actions">
                    <a href={signRefUrl(item.word)} target="_blank" rel="noreferrer">See ASL reference</a>
                    {onPracticeWord && <button onClick={() => onPracticeWord(item.word)}>Fingerspell <b aria-hidden="true">-&gt;</b></button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}

          {passage.questions?.length > 0 ? (
            <Quiz
              questions={passage.questions}
              answers={answers}
              setAnswers={setAnswers}
              submitted={submitted}
              onSubmit={submitQuiz}
              adaptation={adaptation}
              onNext={() => loadPassage()}
            />
          ) : (
            <div className="byoc-actions">
              <p>This is your text, made readable. Reconnect to add vocabulary and a comprehension check.</p>
              <button className="button button--primary" onClick={() => loadPassage()}>Try again <b aria-hidden="true">-&gt;</b></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Quiz({ questions, answers, setAnswers, submitted, onSubmit, adaptation, onNext }) {
  return (
    <Panel label="Comprehension check" meta={`${Object.keys(answers).length} / ${questions.length} answered`}>
      <div className="quiz">
        {questions.map((question, questionIndex) => (
          <fieldset key={`${question.question}-${questionIndex}`}>
            <legend><span>{String(questionIndex + 1).padStart(2, '0')}</span>{question.question}</legend>
            <div className="quiz-options">
              {question.options.map((option, optionIndex) => {
                const selected = answers[questionIndex] === optionIndex
                const correct = question.answerIndex === optionIndex
                const state = submitted ? (correct ? 'is-correct' : selected ? 'is-wrong' : '') : selected ? 'is-selected' : ''
                return (
                  <button key={`${option}-${optionIndex}`} className={state} disabled={submitted} onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}>
                    <span>{String.fromCharCode(65 + optionIndex)}</span>{option}{submitted && correct && <b>correct</b>}
                  </button>
                )
              })}
            </div>
            {submitted && <p className="answer-explanation"><strong>Why /</strong> {question.explanation}</p>}
          </fieldset>
        ))}

        {!submitted ? (
          <button className="button button--primary" onClick={onSubmit} disabled={Object.keys(answers).length < questions.length}>Check my answers <b aria-hidden="true">-&gt;</b></button>
        ) : (
          <AdaptationResult adaptation={adaptation} onNext={onNext} />
        )}
      </div>
    </Panel>
  )
}

function AdaptationResult({ adaptation, onNext }) {
  if (!adaptation) return null
  const message = adaptation.leveledUp
    ? `The coach moved you up to Level ${adaptation.level}.`
    : adaptation.leveledDown
      ? `The coach set Level ${adaptation.level} for more practice.`
      : `The coach will continue at Level ${adaptation.level}.`

  return (
    <div className="adaptation-result" aria-live="polite">
      <div><span>{adaptation.correct} / {adaptation.total}</span><p><strong>Reading plan updated.</strong>{message}</p></div>
      <button className="button button--dark" onClick={onNext}>Next passage <b aria-hidden="true">-&gt;</b></button>
    </div>
  )
}
