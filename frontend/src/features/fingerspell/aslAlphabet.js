// Handshape hints for the full ASL manual alphabet so any word can be practiced
// with guidance. SignBridge auto-recognizes the geometrically distinct letters in
// RECOGNIZABLE; the rest are practiced by handshape and confirmed with "I got it".
export const LETTER_HINTS = {
  A: 'Make a fist. Thumb rests on the side.',
  B: 'Four fingers straight up and together. Thumb across your palm.',
  C: 'Curve your whole hand into the shape of a C.',
  D: 'Index finger points up. Other fingers and thumb form a circle.',
  E: 'Curl your fingers down so the tips meet your thumb.',
  F: 'Thumb and index touch in a circle. Other three fingers point up.',
  G: 'Point your index finger and thumb sideways, close together.',
  H: 'Point your index and middle fingers sideways, held together.',
  I: 'Make a fist. Only your little finger (pinky) points up.',
  J: 'Start like I, then draw a J in the air with your pinky.',
  K: 'Index and middle fingers up in a V, thumb between them.',
  L: 'Thumb out and index finger up — an L shape.',
  M: 'Fold your thumb under your first three fingers.',
  N: 'Fold your thumb under your first two fingers.',
  O: 'Curve all your fingers and thumb together into an O.',
  P: 'Like K, but pointing down toward the floor.',
  Q: 'Like G, but pointing down toward the floor.',
  R: 'Cross your index and middle fingers.',
  S: 'Make a fist with your thumb across the front.',
  T: 'Make a fist with your thumb tucked between index and middle.',
  U: 'Index and middle finger up, held together.',
  V: 'Index and middle finger up, spread apart (peace sign).',
  W: 'Index, middle, and ring finger up and spread.',
  X: 'Make a hook with your index finger.',
  Y: 'Thumb and pinky out, other fingers closed (the “hang loose” shape).',
  Z: 'Point your index finger and draw a Z in the air.',
}

// Letters SignBridge can auto-recognize from webcam landmarks.
export const RECOGNIZABLE = ['A', 'B', 'D', 'I', 'L', 'U', 'V', 'W', 'Y']
export const ALPHABET_SET = RECOGNIZABLE

// Short words built only from recognizable letters, so spelling practice fully auto-completes.
export const PRACTICE_WORDS = ['BUILD', 'BABY', 'WILD', 'LADY', 'VIVID']

// Clean a free word into A–Z letters for fingerspelling practice.
export function sanitizeWord(word) {
  if (typeof word !== 'string') return ''
  return word.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 14)
}
