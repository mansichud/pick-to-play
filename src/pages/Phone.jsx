import { useAuth } from '../auth'
import SignOutButton from '../SignOutButton'

export default function Phone() {
  const { user } = useAuth()
  return (
    <div className="screen phone">
      <header className="bar">
        <span className="brand">PickToPlay</span>
        <SignOutButton />
      </header>
      <p className="muted">Signed in as {user.email}</p>
      <main className="placeholder">
        <p>Rows, search, and title detail arrive in Milestone 2.</p>
      </main>
    </div>
  )
}
