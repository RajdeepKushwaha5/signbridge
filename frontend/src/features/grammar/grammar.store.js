import { addSession, applyAssessment, createProfile, migrateLegacyProfile, observeMisconception, profileSummary, skillsInFocus, validateProfile } from './profile.js'

const KEY = 'signbridge.profile.v3'
const VERSION_2_KEY = 'signbridge.profile.v2'
const LEGACY_KEY = 'signbridge.memory.v1'

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function write(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile))
  return profile
}

export function getProfile() {
  const current = readJSON(KEY)
  if (validateProfile(current)) return current
  return write(migrateLegacyProfile(readJSON(VERSION_2_KEY) || readJSON(LEGACY_KEY)))
}

export function getProfileSummary() {
  return profileSummary(getProfile())
}

export function getSkillsInFocus(limit = 4) {
  return skillsInFocus(getProfile(), limit)
}

export function recordAssessment(assessment) {
  const result = applyAssessment(getProfile(), assessment)
  write(result.profile)
  return result
}

export function recordDiagnosisObservation(observation) {
  return write(observeMisconception(getProfile(), observation))
}

export function recordSession(session) {
  return write(addSession(getProfile(), session))
}

export function resetProfile() {
  localStorage.removeItem(KEY)
  return write(createProfile())
}

export function exportProfile() {
  return JSON.stringify(getProfile(), null, 2)
}

export function importProfile(json) {
  const parsed = JSON.parse(json)
  const migrated = validateProfile(parsed) ? parsed : parsed?.version === 2 && parsed.skills ? migrateLegacyProfile(parsed) : null
  if (!validateProfile(migrated)) throw new Error('This is not a valid SignBridge profile file.')
  return write(migrated)
}
