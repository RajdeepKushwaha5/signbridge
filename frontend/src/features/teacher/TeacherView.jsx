import { useState } from 'react'
import { Panel, SectionTitle } from '../../shared/components/Panel.jsx'
import { exportProfile, getProfile, getSkillsInFocus } from '../grammar/grammar.store.js'
import { SKILL_IDS } from '../grammar/skills.js'
import { getHistory, getLevel } from '../reading/reading.store.js'
import { LEVELS } from '../reading/reading.service.js'
import { computeMilestones, getStreak } from '../progress/progress.js'

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function toCsv(profile) {
  const header = ['skill', 'mastery', 'attempts', 'independentCorrect', 'hintedCorrect', 'transferCorrect', 'mastered', 'lastPracticed', 'nextReview']
  const rows = SKILL_IDS.map((id) => {
    const s = profile.skills[id]
    return [s.label, s.mastery, s.attempts, s.independentCorrect, s.hintedCorrect, s.transferCorrect, s.mastered, s.lastPracticed || '', s.nextReview || '']
  })
  return [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

export default function TeacherView() {
  const [profile] = useState(() => getProfile())
  const skills = SKILL_IDS.map((id) => profile.skills[id])
  const practiced = skills.filter((skill) => skill.attempts > 0)
  const avgMastery = practiced.length ? Math.round(practiced.reduce((sum, skill) => sum + skill.mastery, 0) / practiced.length) : 0
  const masteredCount = skills.filter((skill) => skill.mastered).length
  const focus = getSkillsInFocus(4)
  const sessions = profile.sessions.slice(0, 8)
  const readingLevel = getLevel()
  const readingLevelName = LEVELS.find((level) => level.n === readingLevel)?.name || ''
  const readingRounds = getHistory().length
  const streak = getStreak()
  const milestones = computeMilestones(profile, streak)

  return (
    <div className="feature-page">
      <section className="feature-hero feature-hero--compact">
        <SectionTitle
          eyebrow="04 / Educator view"
          title={<><span>see the learning.</span> not just the activity.</>}
          description="A read-only progress view for teachers: skill mastery, where the learner is stuck, and an exportable report. In a deployed classroom build this aggregates every learner; here it shows the learner on this device."
        />
        <div className="hero-metric">
          <span>{avgMastery}<small style={{ fontSize: '1.4rem' }}>%</small></span>
          <p>average mastery<br /><strong>{masteredCount} of 8 skills mastered</strong></p>
        </div>
      </section>

      <div className="teacher-summary">
        <div><strong>{profile.sessions.length}</strong><span>writing sessions</span></div>
        <div><strong>{practiced.length}</strong><span>skills practiced</span></div>
        <div><strong>{readingLevel} · {readingLevelName}</strong><span>reading level</span></div>
        <div><strong>{readingRounds}</strong><span>reading rounds</span></div>
      </div>

      <Panel label="Skill mastery" meta="8 canonical skills">
        <div className="teacher-table" role="table" aria-label="Skill mastery">
          <div className="teacher-table__head" role="row">
            <span role="columnheader">Skill</span>
            <span role="columnheader">Mastery</span>
            <span role="columnheader">Tries</span>
            <span role="columnheader">Solo</span>
            <span role="columnheader">Hinted</span>
            <span role="columnheader">Transfer</span>
          </div>
          {skills.map((skill) => (
            <div className="teacher-table__row" role="row" key={skill.id}>
              <span role="cell"><strong>{skill.label}</strong>{skill.mastered && <em> mastered</em>}</span>
              <span role="cell" className="teacher-mastery"><progress value={skill.mastery} max="100" />{skill.mastery}%</span>
              <span role="cell">{skill.attempts}</span>
              <span role="cell">{skill.independentCorrect}</span>
              <span role="cell">{skill.hintedCorrect}</span>
              <span role="cell">{skill.transferCorrect}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="teacher-columns">
        <Panel label="Needs support" meta="lowest mastery">
          <div className="teacher-focus">
            {focus.length === 0 ? (
              <p className="teacher-empty">No practice yet. Focus skills appear once the learner starts a session.</p>
            ) : (
              <ol>
                {focus.map((skill) => (
                  <li key={skill.id}><strong>{skill.label}</strong><span>{skill.mastery}% · {skill.attempts} tries</span></li>
                ))}
              </ol>
            )}
          </div>
        </Panel>

        <Panel label="Recent sessions" meta={`${sessions.length} shown`}>
          <div className="teacher-sessions">
            {sessions.length === 0 ? (
              <p className="teacher-empty">No sessions recorded yet.</p>
            ) : (
              <ul>
                {sessions.map((session) => (
                  <li key={session.id || session.completedAt}>
                    <strong>{session.skillId || 'session'}</strong>
                    <span>
                      {session.transferCorrect ? 'transfer ✓' : session.guidedCorrect ? 'guided ✓' : 'practiced'} · {formatDate(session.completedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Panel label="Milestones" meta={`${milestones.filter((item) => item.achieved).length} / ${milestones.length} achieved`}>
        <ul className="milestone-list">
          {milestones.map((milestone) => (
            <li key={milestone.id} className={milestone.achieved ? 'is-achieved' : ''}>
              <span aria-hidden="true">{milestone.achieved ? '✓' : '·'}</span>
              {milestone.label}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel label="Export report" meta="share with families or staff">
        <div className="teacher-export">
          <p>Download this learner's progress to share in a meeting or import later.</p>
          <div className="teacher-export__actions">
            <button className="button button--primary" onClick={() => download('signbridge-progress.csv', toCsv(profile), 'text/csv')}>Download CSV <b aria-hidden="true">-&gt;</b></button>
            <button className="button" onClick={() => download('signbridge-profile.json', exportProfile(), 'application/json')}>Download JSON</button>
          </div>
        </div>
      </Panel>
    </div>
  )
}
