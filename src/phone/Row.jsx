import { useRef } from 'react'
import useAsync from '../useAsync'
import TitleCard from './TitleCard'

// Swipes are counted once each: onScroll fires after the row has been still for 250ms.
export default function Row({ name, load, onScroll }) {
  const { data, error, loading } = useAsync(load, [])
  const settle = useRef(null)
  const handleScroll = () => {
    clearTimeout(settle.current)
    settle.current = setTimeout(() => onScroll?.(), 250)
  }
  return (
    <section className="row">
      <h2>{name}</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Couldn’t load this row.</p>}
      {data && (
        <div className="row-scroll" onScroll={handleScroll}>
          {data.map((t) => (
            <TitleCard key={t.id} title={t} />
          ))}
        </div>
      )}
    </section>
  )
}
