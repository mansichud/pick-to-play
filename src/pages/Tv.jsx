import { useAuth } from '../auth'
import SignOutButton from '../SignOutButton'

export default function Tv() {
  const { user } = useAuth()
  return (
    <div className="screen tv">
      <header className="bar">
        <span className="brand">PickToPlay</span>
        <span className="muted">
          TV · {user.email} · <SignOutButton />
        </span>
      </header>
      <main className="placeholder">
        <p>Browse rows and the trailer player arrive in Milestone 3.</p>
      </main>
    </div>
  )
}
