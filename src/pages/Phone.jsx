import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getGenre, getTopRated, getTrending, GENRE_ROW, hasTmdbToken } from '../tmdb'
import Row from '../phone/Row'
import SearchResults from '../phone/SearchResults'
import SignOutButton from '../SignOutButton'

const ROWS = [
  { name: 'Trending', load: getTrending },
  { name: 'Top Rated', load: getTopRated },
  { name: GENRE_ROW.name, load: () => getGenre(GENRE_ROW.id) },
]

export default function Phone() {
  // The query lives in the URL so Back from a title returns to the same results.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [input, setInput] = useState(query)

  useEffect(() => {
    const trimmed = input.trim()
    if (trimmed === query) return
    const timer = setTimeout(() => setParams(trimmed ? { q: trimmed } : {}, { replace: true }), 350)
    return () => clearTimeout(timer)
  }, [input, query, setParams])

  return (
    <div className="screen phone">
      <header className="bar">
        <span className="brand">PickToPlay</span>
        <SignOutButton />
      </header>
      {!hasTmdbToken ? (
        <p className="error">Missing VITE_TMDB_READ_TOKEN in .env.local. Add it and restart the dev server.</p>
      ) : (
        <>
          <input
            className="search"
            type="search"
            placeholder="Search movies"
            aria-label="Search movies"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {query ? <SearchResults query={query} /> : ROWS.map((r) => <Row key={r.name} {...r} />)}
        </>
      )}
    </div>
  )
}
