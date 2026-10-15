import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth'
import { getDeviceId, touchDevice, useOnlineTv } from '../remote/devices'
import { sendCommand } from '../remote/commands'

const MESSAGES = {
  sending: 'Sending…',
  done: 'Playing on your TV',
  failed: 'The TV couldn’t play this trailer. Try again.',
  timeout: 'The TV didn’t respond. Check it’s on and try again.',
  error: 'Couldn’t send to the TV. Check your connection and try again.',
}

// Shown only while a TV signed in to this account is online.
export default function SendToTv({ movie }) {
  const { user } = useAuth()
  const deviceId = useMemo(() => getDeviceId('phone'), [])
  const tv = useOnlineTv(user.uid)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    touchDevice(user.uid, deviceId, 'phone').catch((err) => console.warn('Device registration failed', err))
  }, [user.uid, deviceId])

  // A new title starts fresh.
  useEffect(() => setStatus('idle'), [movie.id])

  if (!tv) return <p className="muted send-hint">Open PickToPlay on your TV to send trailers to it.</p>
  if (!movie.trailerKey) return <p className="muted send-hint">No trailer available for this title.</p>

  async function send() {
    setStatus('sending')
    try {
      setStatus(await sendCommand(user.uid, deviceId, 'PLAY', { tmdbId: movie.id, trailerKey: movie.trailerKey }))
    } catch (err) {
      console.warn('Send to TV failed', err)
      setStatus('error')
    }
  }

  const isError = ['failed', 'timeout', 'error'].includes(status)
  return (
    <div className="send">
      <button type="button" className="send-button" onClick={send} disabled={status === 'sending'}>
        {status === 'done' ? '✓ Sent to TV' : '▶ Send to TV'}
      </button>
      {status !== 'idle' && (
        <p className={isError ? 'error' : 'muted'} role={isError ? 'alert' : 'status'}>
          {MESSAGES[status]}
        </p>
      )}
    </div>
  )
}
