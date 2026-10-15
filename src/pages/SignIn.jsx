import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const MESSAGES = {
  // Production returns invalid-credential; the emulator returns the older, more specific codes.
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Can’t reach the sign-in server. Is the emulator running?',
}

export default function SignIn({ variant }) {
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signUp'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const action = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword
      await action(auth, email.trim(), password)
    } catch (err) {
      setError(MESSAGES[err.code] || err.message)
      setBusy(false)
    }
  }

  return (
    <div className={`screen ${variant} center`}>
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="brand">PickToPlay</h1>
        <p className="muted">
          {variant === 'tv' ? 'TV' : 'Phone'} · {isSignUp ? 'Create an account' : 'Sign in'}
        </p>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(isSignUp ? 'signIn' : 'signUp')
            setError('')
          }}
        >
          {isSignUp ? 'Have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  )
}
