import { useEffect, useRef, useState } from 'react'
import { OK_KEYS } from './keys'
import { loadYouTubeApi } from './youtube'

// Full-screen trailer. Closes itself when the trailer ends; the TV page closes it on Back.
// onStart/onFail report whether playback actually began (the browser can block autoplay).
export default function TvPlayer({ movie, onClose, onStart, onFail }) {
  const mount = useRef(null)
  const player = useRef(null)
  const [started, setStarted] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [muted, setMuted] = useState(false)
  const callbacks = useRef({ onClose, onStart, onFail })
  callbacks.current = { onClose, onStart, onFail }

  useEffect(() => {
    let cancelled = false
    setStarted(false)
    setStuck(false)
    setMuted(false)
    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      player.current = new YT.Player(mount.current, {
        videoId: movie.trailerKey,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              setStarted(true)
              // Without a key press on the page, YouTube falls back to muted autoplay.
              setMuted(e.target.isMuted())
              callbacks.current.onStart?.()
            } else if (e.data === YT.PlayerState.ENDED) callbacks.current.onClose()
          },
          onError: () => callbacks.current.onFail?.(),
        },
      })
    })
    // If the browser blocked autoplay, offer OK to start it by hand.
    const stuckTimer = setTimeout(() => setStuck(true), 2500)
    return () => {
      cancelled = true
      clearTimeout(stuckTimer)
      player.current?.destroy()
      player.current = null
    }
  }, [movie.trailerKey])

  // OK starts a blocked trailer, or turns the sound on for a muted one.
  useEffect(() => {
    if (started && !muted) return
    function onKey(e) {
      if (!OK_KEYS.includes(e.key)) return
      if (!started) player.current?.playVideo()
      else {
        player.current?.unMute()
        setMuted(false)
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, muted])

  return (
    <div className="tv-player">
      <div className="tv-player-frame">
        <div ref={mount} />
      </div>
      <p className="tv-hint">
        {movie.title} · {!started && stuck ? 'Press OK to start · ' : ''}
        {muted ? 'Sound off, press OK for sound · ' : ''}Back to stop
      </p>
    </div>
  )
}
