import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { startTrial, VARIANTS } from '../remote/trial'

// Facilitator screen: start one test attempt, then hand the TV (or phone) to the participant.
export default function TvTest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [participant, setParticipant] = useState('')
  const [variant, setVariant] = useState('tv_remote')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await startTrial(user.uid, participant.trim().toUpperCase(), variant)
      navigate('/tv')
    } catch (err) {
      console.warn('Starting trial failed', err)
      setError('Couldn’t start the attempt. Check the connection and try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen tv center">
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="brand">Run a test</h1>
        <p className="muted">Starts the timer. The attempt ends when a trailer plays, on Gave up, or after 3 minutes.</p>
        <label>
          Participant code
          <input value={participant} onChange={(e) => setParticipant(e.target.value)} placeholder="P01" required autoFocus />
        </label>
        <fieldset className="variant-picker">
          <legend>Variant</legend>
          {Object.entries(VARIANTS).map(([value, label]) => (
            <label key={value} className="radio">
              <input type="radio" name="variant" value={value} checked={variant === value} onChange={() => setVariant(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start'}</button>
        <Link className="link-plain" to="/results">See results</Link>
      </form>
    </div>
  )
}
