import { searchMovies } from '../tmdb'
import useAsync from '../useAsync'
import TitleCard from './TitleCard'

export default function SearchResults({ query }) {
  const { data, error, loading } = useAsync(() => searchMovies(query), [query])
  if (loading) return <p className="muted">Searching…</p>
  if (error) return <p className="error">Search failed. Try again.</p>
  if (!data.length) return <p className="muted">No titles match “{query}”.</p>
  return (
    <div className="grid">
      {data.map((t) => (
        <TitleCard key={t.id} title={t} />
      ))}
    </div>
  )
}
