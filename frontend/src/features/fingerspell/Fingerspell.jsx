import { useEffect, useMemo, useRef, useState } from 'react'
import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { Panel, SectionTitle } from '../../shared/components/Panel.jsx'
import { getHandLandmarker } from './handLandmarker.js'
import { classifyHand } from './classifyHand.js'
import { ALPHABET_SET, LETTER_HINTS, PRACTICE_WORDS, RECOGNIZABLE, sanitizeWord } from './aslAlphabet.js'

const STABLE_FRAMES = 8 // how many consecutive frames must match before we accept a letter

export default function Fingerspell({ initialWord = null }) {
  const [status, setStatus] = useState('idle') // idle | loading | running | denied | error
  const [preset, setPreset] = useState(() => sanitizeWord(initialWord) || 'BUILD')
  const [index, setIndex] = useState(0)
  const [detected, setDetected] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  const sequence = useMemo(() => (preset === 'ALPHABET' ? ALPHABET_SET : preset.split('')), [preset])
  const target = sequence[index]

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const streamRef = useRef(null)
  const landmarkerRef = useRef(null)
  const targetRef = useRef(target)
  const sequenceRef = useRef(sequence)
  const matchCountRef = useRef(0)
  const lastDetectedRef = useRef(null)

  useEffect(() => { targetRef.current = target }, [target])
  useEffect(() => { sequenceRef.current = sequence }, [sequence])

  // Adopt a word handed over from the reading studio.
  useEffect(() => {
    const word = sanitizeWord(initialWord)
    if (word) setPreset(word)
  }, [initialWord])

  // Reset progress when the practice target changes.
  useEffect(() => { setIndex(0); setCompleted(false); matchCountRef.current = 0 }, [preset])

  // Stop the camera and animation when the component unmounts.
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function advance() {
    setIndex((current) => {
      const next = current + 1
      if (next >= sequenceRef.current.length) {
        setCompleted(true)
        return current
      }
      return next
    })
  }

  function draw(result) {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const landmarks = result.landmarks?.[0]
    if (!landmarks) return
    const utils = new DrawingUtils(ctx)
    utils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#f15a2a', lineWidth: 4 })
    utils.drawLandmarks(landmarks, { color: '#11110f', radius: 4 })
  }

  function loop() {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (video && landmarker && video.readyState >= 2) {
      const result = landmarker.detectForVideo(video, performance.now())
      draw(result)
      const landmarks = result.landmarks?.[0]
      const letter = landmarks ? classifyHand(landmarks) : null
      if (letter !== lastDetectedRef.current) {
        lastDetectedRef.current = letter
        setDetected(letter)
      }
      if (letter && letter === targetRef.current && !completed) {
        matchCountRef.current += 1
        if (matchCountRef.current >= STABLE_FRAMES) {
          matchCountRef.current = 0
          advance()
        }
      } else {
        matchCountRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  async function start() {
    setStatus('loading')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      landmarkerRef.current = await getHandLandmarker()
      setStatus('running')
      rafRef.current = requestAnimationFrame(loop)
    } catch (requestError) {
      if (requestError.name === 'NotAllowedError' || requestError.name === 'NotFoundError') {
        setStatus('denied')
      } else {
        setStatus('error')
        setError(requestError.message)
      }
    }
  }

  return (
    <div className="feature-page">
      <section className="feature-hero feature-hero--compact">
        <SectionTitle
          eyebrow="03 / Sign studio"
          title={<><span>print to sign.</span> on camera.</>}
          description="Fingerspelling links written letters to their handshapes — a visual bridge from print into sign. Form each letter and SignBridge recognizes it live, on your device."
        />
        <div className="hero-metric">
          <span>{completed ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <p>on-device<br /><strong>no internet AI</strong><br />private by design</p>
        </div>
      </section>

      <div className="fingerspell-grid">
        <div className="fingerspell-main">
          <Panel label="Camera" meta={status === 'running' ? 'Tracking' : 'Off'}>
            <div className="camera-stage">
              <video ref={videoRef} className="camera-stage__video" playsInline muted />
              <canvas ref={canvasRef} className="camera-stage__canvas" />
              {status !== 'running' && (
                <div className="camera-stage__overlay">
                  {status === 'idle' && (
                    <>
                      <p>Your camera stays on your device. No video is uploaded — recognition runs fully in your browser.</p>
                      <button className="button button--primary" onClick={start}>Turn on camera <b aria-hidden="true">-&gt;</b></button>
                    </>
                  )}
                  {status === 'loading' && <p>Starting camera and loading the hand model…</p>}
                  {status === 'denied' && <p>Camera access was blocked. Allow camera permission in your browser, then reload.</p>}
                  {status === 'error' && <p>Could not start the camera. {error}</p>}
                </div>
              )}
              {status === 'running' && (
                <div className="camera-stage__readout">
                  <span>Detected</span>
                  <strong>{detected || '—'}</strong>
                </div>
              )}
            </div>
          </Panel>

          {status === 'running' && !completed && (
            <div className="fingerspell-target">
              <div className="fingerspell-target__letter">{target}</div>
              <div className="fingerspell-target__hint">
                <span>Make this handshape</span>
                <p>{LETTER_HINTS[target]}</p>
                {!RECOGNIZABLE.includes(target) && (
                  <em className="fingerspell-note">Auto-detect covers A, B, D, I, L, U, V, W, Y. For this letter, form the shape and tap “I got it”.</em>
                )}
                <button className="button" onClick={advance}>I got it — skip <b aria-hidden="true">-&gt;</b></button>
              </div>
            </div>
          )}

          {completed && (
            <div className="practice-feedback is-correct">
              <span>Complete</span>
              <h3>You fingerspelled “{preset === 'ALPHABET' ? 'the alphabet set' : preset}”.</h3>
              <button className="button button--dark" onClick={() => { setIndex(0); setCompleted(false) }}>Practice again <b aria-hidden="true">-&gt;</b></button>
            </div>
          )}
        </div>

        <aside className="fingerspell-aside">
          <Panel label="Practice" meta={`${index + (completed ? 1 : 0)} / ${sequence.length}`}>
            <div className="fingerspell-progress">
              {sequence.map((letter, letterIndex) => {
                const state = completed || letterIndex < index ? 'done' : letterIndex === index ? 'current' : ''
                return <span key={`${letter}-${letterIndex}`} className={state}>{letter}</span>
              })}
            </div>
            <div className="fingerspell-presets">
              <span className="field-label">Spell a word</span>
              <div className="preset-grid">
                {!PRACTICE_WORDS.includes(preset) && preset !== 'ALPHABET' && (
                  <button className="is-active" title="From the reading studio">{preset}</button>
                )}
                {PRACTICE_WORDS.map((word) => (
                  <button key={word} className={preset === word ? 'is-active' : ''} onClick={() => setPreset(word)}>{word}</button>
                ))}
                <button className={preset === 'ALPHABET' ? 'is-active' : ''} onClick={() => setPreset('ALPHABET')}>A–Y set</button>
              </div>
            </div>
          </Panel>
          <Panel label="Why this matters" meta="Sign-aware">
            <div className="memory-panel">
              <p>Fingerspelling is how Deaf signers spell names and new English words. Practicing it connects each written letter to a handshape — making print visible and physical, not sound-based.</p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
