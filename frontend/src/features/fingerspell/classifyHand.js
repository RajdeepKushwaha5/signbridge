// Classifies 21 MediaPipe hand landmarks into an ASL letter using finger
// geometry. This is heuristic (not a trained model): a finger counts as
// "extended" when its tip is farther from the wrist than its middle joint,
// which is robust to hand rotation. Returns a letter id or null if unsure.

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0))
}

// Finger tip / pip (middle joint) landmark indices.
const FINGERS = {
  index: [8, 6],
  middle: [12, 10],
  ring: [16, 14],
  pinky: [20, 18],
}

export function readFingers(lm) {
  const wrist = lm[0]
  const handScale = dist(wrist, lm[9]) || 0.0001
  const state = {}
  for (const [name, [tip, pip]] of Object.entries(FINGERS)) {
    state[name] = dist(lm[tip], wrist) > dist(lm[pip], wrist)
  }
  // Thumb: extended when its tip sits away from the palm centre (middle MCP).
  state.thumb = dist(lm[4], lm[9]) > handScale * 1.1
  // Spread between index and middle tips, normalised by hand size.
  state.indexMiddleSpread = dist(lm[8], lm[12]) / handScale
  return state
}

export function classifyHand(lm) {
  if (!lm || lm.length < 21) return null
  const f = readFingers(lm)
  const { thumb, index, middle, ring, pinky } = f

  // Four fingers up -> B
  if (index && middle && ring && pinky) return 'B'
  // Three fingers up -> W
  if (index && middle && ring && !pinky) return 'W'
  // Two fingers up -> U (together) or V (spread)
  if (index && middle && !ring && !pinky) return f.indexMiddleSpread > 0.7 ? 'V' : 'U'
  // Index only -> L (with thumb) or D (thumb tucked)
  if (index && !middle && !ring && !pinky) return thumb ? 'L' : 'D'
  // Pinky only -> Y (with thumb) or I
  if (!index && !middle && !ring && pinky) return thumb ? 'Y' : 'I'
  // Closed hand with thumb out -> A
  if (!index && !middle && !ring && !pinky && thumb) return 'A'
  return null
}
