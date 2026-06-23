// Tracks the learner's reading level and adapts it based on quiz performance.
// Like the Grammar Bridge's error memory, this is what makes Read & Decode an
// adaptive agent: the difficulty follows the learner.

const KEY = 'signbridge.reading.v1'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { level: 2, history: [] }
  } catch {
    return { level: 2, history: [] }
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function getLevel() {
  return read().level
}

export function getHistory() {
  return read().history
}

// Record a finished quiz and adapt the level.
// >=2/3 correct levels up; <=1/3 levels down. Returns { level, leveledUp, leveledDown }.
export function recordQuiz(correct, total) {
  const state = read()
  const prev = state.level
  let level = prev
  const ratio = total > 0 ? correct / total : 0
  if (ratio >= 0.67 && level < 5) level += 1
  else if (ratio <= 0.34 && level > 1) level -= 1

  state.level = level
  state.history.push({ at: Date.now(), correct, total, level: prev })
  write(state)
  return { level, leveledUp: level > prev, leveledDown: level < prev }
}

export function resetReading() {
  localStorage.removeItem(KEY)
}
