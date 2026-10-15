import { searchMovies } from '../tmdb'
import useAsync from '../useAsync'
import TitleCard from './TitleCard'

export default function SearchResults({ query }) {
  // useAsync keeps the previous results while the next query loads, so the grid updates in place.
  const { data, error, loading } = useAsync(() => searchMovies(query), [query])
  if (error) return <p className="error">Search failed. Try again.</p>
  if (!data) return <p className="muted">Searching…</p>
  if (!data.length && !loading) return <p className="muted">No titles match “{query}”.</p>
  return (
    <div className={`grid${loading ? ' stale' : ''}`}>
      {data.map((t) => (
        <TitleCard key={t.id} title={t} />
      ))}
    </div>
  )
}
