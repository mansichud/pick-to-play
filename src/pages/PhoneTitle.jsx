import { useNavigate, useParams } from 'react-router-dom'
import { formatRuntime, getMovie, posterUrl } from '../tmdb'
import useAsync from '../useAsync'

export default function PhoneTitle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: movie, error, loading } = useAsync(() => getMovie(id), [id])

  // Back keeps search results and scroll position; a direct link has no history, so go home.
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/phone'))

  return (
    <div className="screen phone">
      <header className="bar">
        <button type="button" className="link" onClick={goBack}>‹ Back</button>
      </header>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Couldn’t load this title.</p>}
      {movie && (
        <article className="detail">
          {movie.posterPath && <img className="detail-poster" src={posterUrl(movie.posterPath, 'w500')} alt="" />}
          <h1>{movie.title}</h1>
          <p className="muted">
            {[movie.year, formatRuntime(movie.runtime), movie.genres.slice(0, 2).join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p>{movie.overview || 'No synopsis available.'}</p>
        </article>
      )}
    </div>
  )
}
