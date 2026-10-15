import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { logEvent, useTrial } from '../remote/trial'

// Last trial this phone has seen, shared across phone pages so only a new one triggers a reset.
let lastTrialId

// Returns a logger for phone events. When the facilitator starts a new attempt, the phone
// returns to its home rows (and onReset clears anything page-local, like the search box).
export default function usePhoneTrial(onReset) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const trial = useTrial(user.uid)
  const trialRef = useRef(trial)
  trialRef.current = trial
  const onResetRef = useRef(onReset)
  onResetRef.current = onReset
  const queued = useRef([]) // events logged before the trial had loaded

  useEffect(() => {
    if (trial === undefined) return // still loading
    for (const [name, extra] of queued.current.splice(0)) logEvent(user.uid, trial, 'phone', name, extra)
    const id = trial?.id ?? null
    const isNew = lastTrialId !== undefined && id && id !== lastTrialId && trial.status === 'running'
    lastTrialId = id
    if (isNew) {
      onResetRef.current?.()
      navigate('/phone', { replace: true })
    }
  }, [trial, navigate, user.uid])

  return useCallback(
    (name, extra) => {
      if (trialRef.current === undefined) queued.current.push([name, extra])
      else logEvent(user.uid, trialRef.current, 'phone', name, extra)
    },
    [user.uid],
  )
}
