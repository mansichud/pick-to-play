import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { endTrial, TRIAL_LIMIT_MS, VARIANTS } from '../remote/trial'

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`

// Facilitator strip on the TV during an attempt: timer, Gave up, and the 3-minute limit.
// Mouse only, so the participant's arrow keys and OK never touch it.
export default function TrialBar({ uid, trial }) {
  const startedAt = trial.startedAt?.toMillis?.() ?? null
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (trial.status !== 'running') return
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [trial.status])

  const elapsed = startedAt ? Math.max(0, now - startedAt) : 0

  useEffect(() => {
    if (trial.status === 'running' && startedAt && elapsed >= TRIAL_LIMIT_MS) endTrial(uid, trial, 'abandoned')
  }, [uid, trial, startedAt, elapsed])

  const endedAt = trial.endedAt?.toMillis?.()
  const label = `${trial.participant} · ${VARIANTS[trial.variant]}`

  if (trial.status === 'running') {
    return (
      <div className="trial-bar">
        <span>{label}</span>
        <span className="trial-timer">{seconds(elapsed)}</span>
        <button
          type="button"
          className="trial-giveup"
          onMouseDown={(e) => e.preventDefault()} // keep keyboard focus off the button
          onClick={() => endTrial(uid, trial, 'abandoned')}
        >
          Gave up
        </button>
      </div>
    )
  }

  return (
    <div className="trial-bar ended">
      <span>
        {label} · {trial.status === 'played' ? 'Played' : 'Abandoned'}
        {startedAt && endedAt ? ` after ${seconds(endedAt - startedAt)}` : ''}
      </span>
      <Link to="/tv/test">Next attempt</Link>
    </div>
  )
}
