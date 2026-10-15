import { formatRuntime, posterUrl } from '../tmdb'

// Title page shown on OK. The TV page owns the keys: OK plays, Back closes.
export default function TvDetail({ movie, error }) {
  if (error) return <div className="tv-detail"><p className="error">Couldn’t load this title. Press Back.</p></div>
  if (!movie) return <div className="tv-detail"><p className="muted">Loading…</p></div>

  const backdrop = posterUrl(movie.backdropPath, 'w1280')
  return (
    <div className="tv-detail" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
      <div className="tv-detail-body">
        <h1>{movie.title}</h1>
        <p className="muted">
          {[movie.year, formatRuntime(movie.runtime), movie.genres.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
        </p>
        <p className="tv-detail-overview">{movie.overview || 'No synopsis available.'}</p>
        {movie.trailerKey ? (
          <span className="tv-button focused">▶ Play trailer</span>
        ) : (
          <p className="muted">No trailer available for this title.</p>
        )}
        <p className="tv-hint">OK to play · Back to return</p>
      </div>
    </div>
  )
}
