import { useAuth } from './auth'
import SignIn from './pages/SignIn'

// Shows the sign-in form in place of the page until a user is signed in.
export default function RequireAuth({ variant, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className={`screen ${variant} center`}>Loading…</div>
  if (!user) return <SignIn variant={variant} />
  return children
}
