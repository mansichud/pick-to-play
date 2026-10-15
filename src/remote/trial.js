import { useEffect, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

// One test attempt: a participant using one variant until playback starts or they give up.
// Stored on sessions/{uid}.trial so the TV and phone both know which attempt is running.

export const VARIANTS = { tv_remote: 'TV remote', phone: 'Phone' }
export const TRIAL_LIMIT_MS = 3 * 60_000

const sessionRef = (uid) => doc(db, 'sessions', uid)

export function useTrial(uid) {
  const [trial, setTrial] = useState(undefined) // undefined while loading, null if none
  useEffect(
    () =>
      onSnapshot(
        sessionRef(uid),
        (snap) => setTrial(snap.data({ serverTimestamps: 'estimate' })?.trial ?? null),
        (err) => console.warn('Trial listener failed', err),
      ),
    [uid],
  )
  return trial
}

// Logs an event for the running trial. Outside a trial nothing is logged, so casual use
// doesn't end up in the results.
export function logEvent(uid, trial, deviceType, name, extra = {}) {
  if (trial?.status !== 'running') return
  addDoc(collection(db, 'events'), {
    uid,
    deviceType,
    name,
    variant: trial.variant,
    trialId: trial.id,
    participant: trial.participant,
    ...(extra.tmdbId != null && { tmdbId: extra.tmdbId }),
    ts: serverTimestamp(),
  }).catch((err) => console.warn(`Event ${name} failed`, err))
}

export async function startTrial(uid, participant, variant) {
  const trial = { id: crypto.randomUUID(), participant, variant, status: 'running' }
  await setDoc(sessionRef(uid), { trial: { ...trial, startedAt: serverTimestamp() }, updatedAt: serverTimestamp() }, { merge: true })
  logEvent(uid, trial, 'tv', 'browse_open')
  return trial
}

// Trials this page has already ended. The snapshot lags the write, and YouTube can report
// "playing" more than once, so status alone can't stop a second playback_start.
const ended = new Set()

// Ends the running trial once: 'played' after playback_start, 'abandoned' after abandon.
export function endTrial(uid, trial, outcome, tmdbId) {
  if (trial?.status !== 'running' || ended.has(trial.id)) return
  ended.add(trial.id)
  logEvent(uid, trial, 'tv', outcome === 'played' ? 'playback_start' : 'abandon', { tmdbId })
  updateDoc(sessionRef(uid), { 'trial.status': outcome, 'trial.endedAt': serverTimestamp() }).catch((err) =>
    console.warn('Ending trial failed', err),
  )
}
