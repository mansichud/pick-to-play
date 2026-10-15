import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="screen phone center">
      <div className="card">
        <h1 className="brand">PickToPlay</h1>
        <p className="muted">Open this device as…</p>
        <Link className="button" to="/tv">TV</Link>
        <Link className="button" to="/phone">Phone</Link>
      </div>
    </div>
  )
}
