import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// Loads Google's MediaPipe hand-tracking model once and reuses it.
// Everything here runs 100% in the browser — no API, no Gemini quota — so
// Fingerspell keeps working even when the AI features are rate-limited.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let landmarkerPromise = null

export function getHandLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        numHands: 1,
        runningMode: 'VIDEO',
      })
    })().catch((error) => {
      landmarkerPromise = null // allow a retry on failure
      throw error
    })
  }
  return landmarkerPromise
}
