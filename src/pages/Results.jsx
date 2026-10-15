import { collection, getDocs, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { db } from '../firebase'
import { VARIANTS } from '../remote/trial'
import useAsync from '../useAsync'

const COUNTED = ['row_scroll', 'search', 'title_view', 'send_to_tv']

async function loadTrials(uid) {
  const snap = await getDocs(query(collection(db, 'events'), where('uid', '==', uid)))
  const byTrial = new Map()
  for (const d of snap.docs) {
    const e = d.data()
    if (!e.trialId || !e.ts) continue
    if (!byTrial.has(e.trialId)) byTrial.set(e.trialId, [])
    byTrial.get(e.trialId).push({ ...e, ms: e.ts.toMillis() })
  }

  return [...byTrial.entries()]
    .map(([id, events]) => {
      events.sort((a, b) => a.ms - b.ms)
      const open = events.find((e) => e.name === 'browse_open')
      const end = events.find((e) => e.name === 'playback_start' || e.name === 'abandon')
      const counts = Object.fromEntries(COUNTED.map((n) => [n, events.filter((e) => e.name === n).length]))
      return {
        id,
        participant: events[0].participant,
        variant: events[0].variant,
        startedAt: open?.ms ?? events[0].ms,
        outcome: !end ? 'incomplete' : end.name === 'playback_start' ? 'played' : 'abandoned',
        // time-to-play = playback_start - browse_open, both server timestamps
        seconds: open && end ? (end.ms - open.ms) / 1000 : null,
        tmdbId: end?.tmdbId,
        counts,
      }
    })
    .sort((a, b) => a.startedAt - b.startedAt)
}

function median(values) {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const fmt = (sec) => (sec == null ? '—' : `${sec.toFixed(1)}s`)

function toCsv(trials) {
  const header = ['participant', 'variant', 'started_at', 'outcome', 'time_to_play_s', 'tmdb_id', ...COUNTED]
  const rows = trials.map((t) => [
    t.participant,
    t.variant,
    new Date(t.startedAt).toISOString(),
    t.outcome,
    t.outcome === 'played' ? t.seconds.toFixed(3) : '',
    t.tmdbId ?? '',
    ...COUNTED.map((n) => t.counts[n]),
  ])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}

function download(trials) {
  const url = URL.createObjectURL(new Blob([toCsv(trials)], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'picktoplay-results.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

export default function Results() {
  const { user } = useAuth()
  const { data: trials, error, loading } = useAsync(() => loadTrials(user.uid), [user.uid])

  return (
    <div className="screen results">
      <header className="bar">
        <h1 className="brand">Results</h1>
        <span>
          <Link to="/tv/test" className="link-plain">Run a test</Link>
          {trials?.length > 0 && (
            <>
              {' · '}
              <button type="button" className="link" onClick={() => download(trials)}>Download CSV</button>
            </>
          )}
        </span>
      </header>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Couldn’t load results.</p>}
      {trials && !trials.length && <p className="muted">No attempts yet. Start one from Run a test.</p>}

      {trials?.length > 0 && (
        <>
          <p className="muted">
            Time-to-play = playback_start − browse_open. Medians use attempts that played; abandons are counted
            separately. Incomplete attempts (no end event) are listed but left out of both.
          </p>
          <div className="summary">
            {Object.entries(VARIANTS).map(([variant, label]) => {
              const mine = trials.filter((t) => t.variant === variant)
              const played = mine.filter((t) => t.outcome === 'played')
              const abandoned = mine.filter((t) => t.outcome === 'abandoned').length
              return (
                <section key={variant} className="summary-card">
                  <h2>{label}</h2>
                  <p className="summary-big">{fmt(median(played.map((t) => t.seconds)))}</p>
                  <p className="muted">median time-to-play</p>
                  <p>
                    {played.length} played · {abandoned} abandoned
                    {mine.length - played.length - abandoned > 0 && ` · ${mine.length - played.length - abandoned} incomplete`}
                  </p>
                  <p className="muted">{new Set(mine.map((t) => t.participant)).size} participants</p>
                </section>
              )
            })}
          </div>

          <table className="trials">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Variant</th>
                <th>Started</th>
                <th>Outcome</th>
                <th className="num">Time-to-play</th>
                {COUNTED.map((n) => <th key={n} className="num">{n}</th>)}
              </tr>
            </thead>
            <tbody>
              {trials.map((t) => (
                <tr key={t.id}>
                  <td>{t.participant}</td>
                  <td>{VARIANTS[t.variant] ?? t.variant}</td>
                  <td>{new Date(t.startedAt).toLocaleString()}</td>
                  <td>{t.outcome}</td>
                  <td className="num">{t.outcome === 'played' ? fmt(t.seconds) : '—'}</td>
                  {COUNTED.map((n) => <td key={n} className="num">{t.counts[n]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
