import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth'
import { BROWSE_ROWS, getMovie, hasTmdbToken, posterUrl } from '../tmdb'
import useAsync from '../useAsync'
import TvDetail from '../tv/TvDetail'
import TvPlayer from '../tv/TvPlayer'
import TvSearch from '../tv/TvSearch'
import { BACK_KEYS, OK_KEYS, isShortcut } from '../tv/keys'
import SignOutButton from '../SignOutButton'

// Row -1 is the Search button above the rows.
const SEARCH_ROW = -1

const loadRows = () =>
  Promise.all(BROWSE_ROWS.map(async (r) => ({ name: r.name, titles: await r.load() })))

export default function Tv() {
  const { user } = useAuth()
  const { data: rows, error } = useAsync(loadRows, [])

  // Focus is one row plus a remembered column per row, like most TV apps.
  const [row, setRow] = useState(0)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('') // kept until the page reloads
  const [cols, setCols] = useState([0, 0, 0])
  const [open, setOpen] = useState(null) // { id } of the title whose detail page is open
  const [detail, setDetail] = useState({ movie: null, error: null })
  const [playing, setPlaying] = useState(null)
  const focusedCard = useRef(null)

  const col = cols[row] ?? 0
  const focused = rows?.[row]?.titles[col]

  const openTitle = useCallback((t) => setOpen({ id: t.id }), [])
  const exitSearch = useCallback(() => setSearching(false), [])

  // Load the detail page's data when a title is opened.
  useEffect(() => {
    if (!open) return
    let active = true
    setDetail({ movie: null, error: null })
    getMovie(open.id).then(
      (movie) => active && setDetail({ movie, error: null }),
      (err) => active && setDetail({ movie: null, error: err }),
    )
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    focusedCard.current?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [row, col, rows, searching])

  useEffect(() => {
    if (!rows) return
    function onKey(e) {
      if (isShortcut(e)) return

      if (playing) {
        if (BACK_KEYS.includes(e.key)) setPlaying(null)
        else return
      } else if (open) {
        if (BACK_KEYS.includes(e.key)) setOpen(null)
        else if (OK_KEYS.includes(e.key) && detail.movie?.trailerKey) setPlaying(detail.movie)
        else return
      } else if (searching) {
        return // TvSearch handles its own keys
      } else if (row === SEARCH_ROW) {
        if (e.key === 'ArrowDown') setRow(0)
        else if (OK_KEYS.includes(e.key)) setSearching(true)
        else return
      } else {
        const count = rows[row].titles.length
        if (e.key === 'ArrowUp') setRow((r) => r - 1)
        else if (e.key === 'ArrowDown') setRow((r) => Math.min(rows.length - 1, r + 1))
        else if (e.key === 'ArrowLeft') setCols((c) => c.with(row, Math.max(0, c[row] - 1)))
        else if (e.key === 'ArrowRight') setCols((c) => c.with(row, Math.min(count - 1, c[row] + 1)))
        else if (OK_KEYS.includes(e.key) && focused) setOpen({ id: focused.id })
        else return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, row, focused, open, detail, playing, searching])

  return (
    <div className="screen tv">
      <header className="bar">
        <span className="brand">PickToPlay</span>
        <span className="muted">
          TV · {user.email} · <SignOutButton />
        </span>
      </header>

      {!hasTmdbToken && <p className="error">Missing VITE_TMDB_READ_TOKEN in .env.local.</p>}
      {error && <p className="error">Couldn’t load titles. Reload to try again.</p>}
      {hasTmdbToken && !rows && !error && <p className="muted">Loading…</p>}

      {searching && <TvSearch query={searchQuery} setQuery={setSearchQuery} active={!open && !playing} onOpen={openTitle} onExit={exitSearch} />}

      {rows && !searching && (
        <div
          ref={row === SEARCH_ROW ? focusedCard : undefined}
          className={`tv-search-button${row === SEARCH_ROW ? ' focused' : ''}`}
        >
          ⌕ Search
        </div>
      )}

      {rows && !searching && (
        <p className="tv-focused-title">
          {focused?.title}
          {focused?.year && ` (${focused.year})`}
        </p>
      )}

      {!searching && rows?.map((r, ri) => (
        <section key={r.name} className={`tv-row${ri === row ? ' active' : ''}`}>
          <h2>{r.name}</h2>
          <div className="tv-row-scroll">
            {r.titles.map((t, ci) => {
              const isFocused = ri === row && ci === (cols[ri] ?? 0)
              return (
                <div
                  key={t.id}
                  ref={isFocused ? focusedCard : undefined}
                  className={`tv-card${isFocused ? ' focused' : ''}`}
                >
                  {t.posterPath ? <img src={posterUrl(t.posterPath)} alt="" /> : <div className="poster-missing">{t.title}</div>}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {open && <TvDetail movie={detail.movie} error={detail.error} />}
      {playing && <TvPlayer movie={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}
