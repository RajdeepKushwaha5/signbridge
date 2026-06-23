// Streak + milestone tracking. Pure helpers (testable) plus thin localStorage
// wrappers. Streak = consecutive calendar days with at least one finished session.

const STREAK_KEY = 'signbridge.streak.v1'
const SEEN_KEY = 'signbridge.milestones.seen.v1'

function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function previousDayKey(ts) {
  const date = new Date(ts)
  date.setDate(date.getDate() - 1)
  return dayKey(date.getTime())
}

const emptyStreak = { current: 0, best: 0, lastDay: null }

// Pure: given the previous streak and "now", return the updated streak.
export function updateStreak(previous, now) {
  const prev = previous || emptyStreak
  const today = dayKey(now)
  if (prev.lastDay === today) return { ...prev }
  const yesterday = previousDayKey(now)
  const current = prev.lastDay === yesterday ? (prev.current || 0) + 1 : 1
  return { current, best: Math.max(prev.best || 0, current), lastDay: today }
}

function readStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY)) || { ...emptyStreak }
  } catch {
    return { ...emptyStreak }
  }
}

export function getStreak() {
  return readStreak()
}

export function recordActivity(now = Date.now()) {
  const next = updateStreak(readStreak(), now)
  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

// --- Milestones --------------------------------------------------------------

function skillList(profile) {
  return profile?.skills ? Object.values(profile.skills) : []
}
function independentTransfers(profile) {
  return (profile?.sessions || []).filter((session) => session.transferCorrect && session.transferHints === 0).length
}
function masteredCount(profile) {
  return skillList(profile).filter((skill) => skill.mastered).length
}
function sessionCount(profile) {
  return Array.isArray(profile?.sessions) ? profile.sessions.length : 0
}

export const MILESTONES = [
  { id: 'first-bridge', label: 'First bridge built', test: (p) => sessionCount(p) >= 1 },
  { id: 'first-transfer', label: 'First independent transfer', test: (p) => independentTransfers(p) >= 1 },
  { id: 'first-master', label: 'First skill mastered', test: (p) => masteredCount(p) >= 1 },
  { id: 'streak-3', label: '3-day learning streak', test: (_p, s) => (s?.best || 0) >= 3 },
  { id: 'sessions-5', label: '5 sessions complete', test: (p) => sessionCount(p) >= 5 },
  { id: 'three-master', label: '3 skills mastered', test: (p) => masteredCount(p) >= 3 },
]

// Pure: full milestone list with achieved flags.
export function computeMilestones(profile, streak) {
  return MILESTONES.map((milestone) => ({
    id: milestone.id,
    label: milestone.label,
    achieved: Boolean(milestone.test(profile, streak)),
  }))
}

// Returns milestones newly achieved since last call (and records them as seen).
export function pickNewMilestones(profile, streak) {
  const achieved = computeMilestones(profile, streak).filter((milestone) => milestone.achieved)
  let seen = []
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || []
  } catch {
    seen = []
  }
  const fresh = achieved.filter((milestone) => !seen.includes(milestone.id))
  localStorage.setItem(SEEN_KEY, JSON.stringify(achieved.map((milestone) => milestone.id)))
  return fresh
}

export function resetProgress() {
  localStorage.removeItem(STREAK_KEY)
  localStorage.removeItem(SEEN_KEY)
}
