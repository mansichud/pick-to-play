// Loads the YouTube IFrame Player API once and resolves with window.YT.
let ready

export function loadYouTubeApi() {
  if (!ready) {
    ready = new Promise((resolve) => {
      if (window.YT?.Player) return resolve(window.YT)
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.append(script)
    })
  }
  return ready
}
