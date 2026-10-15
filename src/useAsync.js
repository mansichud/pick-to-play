import { useEffect, useState } from 'react'

// Runs an async loader whenever deps change; ignores results from superseded runs.
export default function useAsync(load, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, error: null, loading: true }))
    load().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState({ data: null, error, loading: false }),
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
