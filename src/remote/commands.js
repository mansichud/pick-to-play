import { useEffect, useRef } from 'react'
import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export const PENDING_TIMEOUT_MS = 5_000
export const STALE_AFTER_MS = 30_000

const commandsOf = (uid) => collection(db, 'sessions', uid, 'commands')

// Phone side: write a command and report its fate.
// Resolves 'done' or 'failed' from the TV, or 'timeout' if still pending after 5s.
export async function sendCommand(uid, fromDeviceId, type, payload) {
  const ref = doc(commandsOf(uid), crypto.randomUUID())
  await setDoc(ref, { type, payload, fromDeviceId, createdAt: serverTimestamp(), status: 'pending' })
  return new Promise((resolve) => {
    let stop = () => {}
    const finish = (result) => {
      clearTimeout(timer)
      stop()
      resolve(result)
    }
    // After 5s the phone gives up and retires the command, so a TV that comes back later
    // doesn't start a trailer the user was already told failed.
    const timer = setTimeout(() => {
      finish('timeout')
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (snap.data()?.status === 'pending') tx.update(ref, { status: 'failed' })
      }).catch((err) => console.warn('Could not retire timed-out command', err))
    }, PENDING_TIMEOUT_MS)
    stop = onSnapshot(
      ref,
      (snap) => {
        const status = snap.data()?.status
        if (status === 'done' || status === 'failed') finish(status)
      },
      () => finish('failed'),
    )
  })
}

// TV side: run each pending command once. `handle` returns a promise of true (done) or false (failed).
export function useCommandListener(uid, handle) {
  const handleRef = useRef(handle)
  handleRef.current = handle
  const seen = useRef(new Set())

  useEffect(() => {
    const q = query(commandsOf(uid), where('status', '==', 'pending'))
    return onSnapshot(
      q,
      (snap) => {
        for (const change of snap.docChanges()) {
          if (change.type !== 'added') continue
          const { id, ref } = change.doc
          if (seen.current.has(id)) continue // a resent command must not run twice
          seen.current.add(id)

          const command = change.doc.data()
          const mark = (status) => updateDoc(ref, { status }).catch((err) => console.warn('Command update failed', err))
          const createdAt = command.createdAt?.toMillis() ?? 0
          if (Date.now() - createdAt > STALE_AFTER_MS) {
            mark('failed') // too old: don't let it start playback now
            continue
          }
          Promise.resolve(handleRef.current(command))
            .catch(() => false)
            .then((ok) => mark(ok ? 'done' : 'failed'))
        }
      },
      (err) => console.warn('Command listener failed', err),
    )
  }, [uid])
}
