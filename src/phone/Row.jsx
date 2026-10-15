import useAsync from '../useAsync'
import TitleCard from './TitleCard'

export default function Row({ name, load }) {
  const { data, error, loading } = useAsync(load, [])
  return (
    <section className="row">
      <h2>{name}</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Couldn’t load this row.</p>}
      {data && (
        <div className="row-scroll">
          {data.map((t) => (
            <TitleCard key={t.id} title={t} />
          ))}
        </div>
      )}
    </section>
  )
}
