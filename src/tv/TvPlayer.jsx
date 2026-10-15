import { useEffect, useRef } from 'react'
import { loadYouTubeApi } from './youtube'

// Full-screen trailer. Closes itself when the trailer ends; the TV page closes it on Back.
export default function TvPlayer({ movie, onClose }) {
  const mount = useRef(null)

  useEffect(() => {
    let player
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      player = new YT.Player(mount.current, {
        videoId: movie.trailerKey,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => e.data === YT.PlayerState.ENDED && onClose(),
        },
      })
    })
    return () => {
      cancelled = true
      player?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.trailerKey])

  return (
    <div className="tv-player">
      <div className="tv-player-frame">
        <div ref={mount} />
      </div>
      <p className="tv-hint">{movie.title} · Back to stop</p>
    </div>
  )
}
