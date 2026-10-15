import { Link } from 'react-router-dom'
import { posterUrl } from '../tmdb'

export default function TitleCard({ title }) {
  const src = posterUrl(title.posterPath)
  return (
    <Link className="title-card" to={`/phone/title/${title.id}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <div className="poster-missing">{title.title}</div>
      )}
      <span className="title-card-name">{title.title}</span>
    </Link>
  )
}
