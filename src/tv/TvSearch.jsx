import { useEffect, useRef, useState } from 'react'
import { posterUrl, searchMovies } from '../tmdb'
import useAsync from '../useAsync'
import { BACK_KEYS, OK_KEYS, isShortcut } from './keys'

// On-screen keyboard, moved with arrows and OK like a TV remote. Wide keys repeat across columns.
const KEYS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
  ['SPACE', 'SPACE', 'SPACE', 'DELETE', 'DELETE', 'DELETE'],
]
const LABELS = { SPACE: 'Space', DELETE: '⌫ Delete' }
const LAST_ROW = KEYS.length - 1

// Steps left or right past repeats of a wide key, so one press moves one key.
function stepCol(r, c, dir) {
  let next = c
  while (next + dir >= 0 && next + dir < KEYS[r].length) {
    next += dir
    if (KEYS[r][next] !== KEYS[r][c]) return next
  }
  return c
}

// The TV page owns `query` so the search survives leaving and reopening it.
export default function TvSearch({ query, setQuery, active, onOpen, onExit, onSearch }) {
  const [debounced, setDebounced] = useState(query.trim())
  const [zone, setZone] = useState('keys') // 'clear' | 'keys' | 'results'
  const [key, setKey] = useState({ r: 0, c: 0 })
  const [resultCol, setResultCol] = useState(0)
  const focusedEl = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 150)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, loading } = useAsync(
    () => (debounced ? searchMovies(debounced) : Promise.resolve([])),
    [debounced],
  )
  const hasResults = results?.length > 0

  // New results start from the first title.
  useEffect(() => setResultCol(0), [debounced])

  // Log each settled query, but not the one restored when search reopens.
  const lastLogged = useRef(debounced)
  useEffect(() => {
    if (!debounced || debounced === lastLogged.current) return
    lastLogged.current = debounced
    onSearch?.(debounced)
  }, [debounced, onSearch])

  useEffect(() => {
    focusedEl.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [zone, key, resultCol])

  useEffect(() => {
    if (!active) return
    function press(k) {
      if (k === 'SPACE') setQuery((q) => q + ' ')
      else if (k === 'DELETE') setQuery((q) => q.slice(0, -1))
      else setQuery((q) => q + k.toLowerCase())
    }
    function onKey(e) {
      if (isShortcut(e)) return
      if (BACK_KEYS.includes(e.key)) onExit()
      else if (zone === 'clear') {
        if (e.key === 'ArrowDown') setZone('keys')
        else if (OK_KEYS.includes(e.key)) {
          setQuery('')
          setZone('keys')
        } else if (e.key.length !== 1) return
      } else if (zone === 'keys') {
        const { r, c } = key
        if (e.key === 'ArrowUp') {
          if (r > 0) setKey({ r: r - 1, c })
          else if (query) setZone('clear')
        }
        else if (e.key === 'ArrowDown') {
          if (r < LAST_ROW) setKey({ r: r + 1, c })
          else if (hasResults) setZone('results')
        } else if (e.key === 'ArrowLeft') setKey({ r, c: stepCol(r, c, -1) })
        else if (e.key === 'ArrowRight') setKey({ r, c: stepCol(r, c, 1) })
        else if (OK_KEYS.includes(e.key)) press(KEYS[r][c])
        // Letters typed on the laptop are swallowed: on a TV the only way to type is the grid.
        else if (e.key.length !== 1) return
      } else {
        if (e.key === 'ArrowUp') setZone('keys')
        else if (e.key === 'ArrowLeft') setResultCol((i) => Math.max(0, i - 1))
        else if (e.key === 'ArrowRight') setResultCol((i) => Math.min(results.length - 1, i + 1))
        else if (OK_KEYS.includes(e.key)) onOpen(results[resultCol])
        else if (e.key.length !== 1) return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, zone, key, query, setQuery, results, resultCol, hasResults, onOpen, onExit])

  // Focus can't stay on results that disappeared or on Clear once the field is empty.
  useEffect(() => {
    if ((zone === 'results' && !hasResults) || (zone === 'clear' && !query)) setZone('keys')
  }, [zone, hasResults, query])

  const focusedTitle = zone === 'results' ? results?.[resultCol] : null

  return (
    <div className="tv-search">
      <div className="tv-search-field">
        <div className="tv-search-query">
          <span className="muted">Search</span> {query}
          <span className="tv-caret" />
        </div>
        {query && (
          <div ref={zone === 'clear' ? focusedEl : undefined} className={`tv-key tv-clear${zone === 'clear' ? ' focused' : ''}`}>
            ✕ Clear
          </div>
        )}
      </div>

      <div className="tv-keyboard">
        {KEYS.map((row, r) =>
          row
            .filter((k, c) => row.indexOf(k) === c)
            .map((k) => {
              const isFocused = zone === 'keys' && key.r === r && KEYS[r][key.c] === k
              return (
                <div
                  key={`${r}-${k}`}
                  ref={isFocused ? focusedEl : undefined}
                  className={`tv-key${isFocused ? ' focused' : ''}`}
                  style={{ gridColumn: `span ${row.filter((x) => x === k).length}` }}
                >
                  {LABELS[k] ?? k}
                </div>
              )
            }),
        )}
      </div>

      <section className={`tv-row${zone === 'results' ? ' active' : ''}`}>
        <h2>
          {focusedTitle
            ? `${focusedTitle.title}${focusedTitle.year ? ` (${focusedTitle.year})` : ''}`
            : debounced
              ? loading ? 'Searching…' : hasResults ? 'Results' : `No titles match “${debounced}”`
              : 'Type to search all movies'}
        </h2>
        {hasResults && (
          <div className={`tv-row-scroll${loading ? ' stale' : ''}`}>
            {results.map((t, i) => {
              const isFocused = zone === 'results' && i === resultCol
              return (
                <div
                  key={t.id}
                  ref={isFocused ? focusedEl : undefined}
                  className={`tv-card small${isFocused ? ' focused' : ''}`}
                >
                  <img src={posterUrl(t.posterPath)} alt="" />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
