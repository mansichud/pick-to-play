import { signOut } from 'firebase/auth'
import { auth } from './firebase'

export default function SignOutButton() {
  return (
    <button type="button" className="link" onClick={() => signOut(auth)}>
      Sign out
    </button>
  )
}
