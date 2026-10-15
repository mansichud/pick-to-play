import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export const HEARTBEAT_MS = 10_000
export const ONLINE_WINDOW_MS = 30_000

// One stable ID per browser and device type, so a reload doesn't register a new device.
export function getDeviceId(type) {
  const storageKey = `picktoplay.deviceId.${type}`
  let id = null
  try {
    id = localStorage.getItem(storageKey)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(storageKey, id)
    }
  } catch {
    id ??= crypto.randomUUID() // storage blocked: a fresh ID for this page load
  }
  return id
}

export function touchDevice(uid, deviceId, type) {
  return setDoc(
    doc(db, 'devices', deviceId),
    { uid, type, name: type === 'tv' ? 'TV' : 'Phone', lastSeen: serverTimestamp() },
    { merge: true },
  )
}

// TV side: register as this account's TV and send a heartbeat every 10s.
export function useTvHeartbeat(uid, deviceId) {
  useEffect(() => {
    const beat = () => touchDevice(uid, deviceId, 'tv').catch((err) => console.warn('Heartbeat failed', err))
    beat()
    setDoc(doc(db, 'sessions', uid), { tvDeviceId: deviceId, updatedAt: serverTimestamp() }, { merge: true }).catch(
      (err) => console.warn('Session update failed', err),
    )
    const timer = setInterval(beat, HEARTBEAT_MS)
    return () => clearInterval(timer)
  }, [uid, deviceId])
}

// Phone side: the most recently seen TV for this account, or null if none checked in within 30s.
export function useOnlineTv(uid) {
  const [tvs, setTvs] = useState([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const q = query(collection(db, 'devices'), where('uid', '==', uid), where('type', '==', 'tv'))
    return onSnapshot(
      q,
      (snap) => setTvs(snap.docs.map((d) => ({ id: d.id, lastSeen: d.data().lastSeen?.toMillis() ?? 0 }))),
      (err) => console.warn('TV presence listener failed', err),
    )
  }, [uid])

  // Re-check every few seconds so a TV that stops sending heartbeats goes offline.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(timer)
  }, [])

  const online = tvs.filter((tv) => now - tv.lastSeen < ONLINE_WINDOW_MS)
  return online.sort((a, b) => b.lastSeen - a.lastSeen)[0] ?? null
}
