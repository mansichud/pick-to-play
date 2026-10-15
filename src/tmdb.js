// Thin TMDB client. Movies only; responses are cached in memory for the page's lifetime.
const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'
const token = import.meta.env.VITE_TMDB_READ_TOKEN

export const hasTmdbToken = Boolean(token)

// Genre for the phone page's genre row (TMDB movie genre IDs).
export const GENRE_ROW = { id: 35, name: 'Comedy' }

const cache = new Map()

async function get(path, params = {}) {
  const url = `${API}${path}?${new URLSearchParams({ language: 'en-US', ...params })}`
  if (!cache.has(url)) {
    const request = fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`)
      return res.json()
    })
    cache.set(url, request)
    // Drop failures so a retry can succeed.
    request.catch(() => cache.delete(url))
  }
  return cache.get(url)
}

const toTitle = (m) => ({
  id: m.id,
  title: m.title,
  year: m.release_date ? m.release_date.slice(0, 4) : '',
  posterPath: m.poster_path,
})

const list = async (path, params) => (await get(path, params)).results.map(toTitle)

export const getTrending = () => list('/trending/movie/week')
export const getTopRated = () => list('/movie/top_rated')
export const getGenre = (genreId) =>
  list('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', 'vote_count.gte': 200 })
export const searchMovies = (query) => list('/search/movie', { query, include_adult: false })

export async function getMovie(id) {
  const m = await get(`/movie/${id}`, { append_to_response: 'videos' })
  const trailer =
    m.videos?.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    m.videos?.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  return {
    ...toTitle(m),
    overview: m.overview,
    runtime: m.runtime, // minutes, may be 0 or null
    genres: m.genres.map((g) => g.name),
    backdropPath: m.backdrop_path,
    trailerKey: trailer?.key ?? null,
  }
}

export const posterUrl = (path, size = 'w342') => (path ? `${IMG}/${size}${path}` : null)

export function formatRuntime(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
