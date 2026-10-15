# CLAUDE.md — Phone-to-TV Discovery Prototype

Working name: **PickToPlay** (rename later; never use Netflix's name, logo, or assets in the app).

## Why this project exists
- Portfolio project to show product understanding for a Netflix **Core Discovery PM** role.
- JD language to reflect: help members **discover, choose, and engage**; solutions that **scale across TV, mobile, tablet, and web**; **experimentation** and **research** to guide decisions.
- Context: Netflix removed phone casting for most devices in late 2025 and gave no official reason. Reporting suggests it wanted more control of the TV interface, viewer data, and ads.
- Product thesis: **phone as a remote for the TV app, not casting.** Playback stays in the TV app, so the platform keeps control of UI, data, and ads. The phone makes browsing and choosing faster.

## Owner and working style
- Mansi is the PM: she owns requirements, scope, and decisions. Claude Code implements.
- Spec-driven: build one P0 item at a time, show it working, then move on.
- Ask before adding dependencies, changing the data model, or expanding scope.

## Goal and success metric
- **Primary metric: time-to-play** = `playback_start` minus `browse_open`, in seconds.
- Hypothesis: choosing on the phone and sending to the TV is faster than arrow-key browsing on the TV.
- Test: 10–15 people, each does both versions in alternating order. Report the median time-to-play and the number who quit without choosing.
- Honesty rule: report whatever the result is. No made-up or rounded-up numbers.

## Scope

### P0 — must ship
1. **Auth:** Firebase Auth (email or Google). The same account is signed in on the phone and the TV.
2. **TV page** (10-foot UI, desktop browser stands in for a TV):
   - Arrow-key browse rows (this is the control condition for the test)
   - Player that plays a title's trailer
   - Listens for commands from the phone
3. **Phone page** (mobile web):
   - Rows: Trending, Top Rated, and one genre row, plus search
   - Title detail: poster, synopsis, year, runtime
   - **Send to TV** button, shown only when a TV is online for this account
4. **Sync:** Firestore real-time listener; the phone writes commands and the TV acts on them.
5. **Instrumentation:** log the events listed below to Firestore.

### P1 — fast follow
- Playback controls on the phone: pause, resume, skip ±10s, in-app volume
- "Now playing" state shown on the phone
- Simple results page that computes time-to-play from the event log

### P2 — only if time allows
- "Help me choose": a mood picker that narrows to 3 titles
- A second phone controlling the same TV

### Out of scope
- TV hardware volume (needs device-level access; in-app volume only)
- Real TV apps (Tizen, webOS, Android TV); the browser stands in for the TV
- Streaming real full-length content; trailers only
- Profiles, kids mode, downloads, payments

## Stack
- React + Vite (one app with routes `/tv` and `/phone`)
- Firebase Auth + Firestore (use the emulator suite for local development)
- TMDB API for titles, images, and trailer keys (`/movie/{id}/videos`)
- YouTube IFrame Player API to play trailers on the TV page
- Hosting: Firebase Hosting or Vercel

## Data model (Firestore)
```
devices/{deviceId}
  uid, type: "tv" | "phone", lastSeen (timestamp), name

sessions/{uid}
  tvDeviceId, nowPlaying: { tmdbId, title, trailerKey },
  state: "idle" | "playing" | "paused", positionSec, volume (0–100), updatedAt

sessions/{uid}/commands/{commandId}
  type: "PLAY" | "PAUSE" | "RESUME" | "SEEK" | "VOLUME"
  payload: { tmdbId?, trailerKey?, deltaSec?, volume? }
  fromDeviceId, createdAt, status: "pending" | "done" | "failed"

events/{eventId}
  uid, deviceType, name, tmdbId?, variant: "tv_remote" | "phone", ts
```

## Sync rules
- The TV sends a heartbeat that updates `devices/{id}.lastSeen` every 10s. The phone treats the TV as online if `lastSeen` is under 30s old.
- `commandId` is generated on the phone (UUID). The TV ignores a command it has already processed, so a resent command doesn't run twice.
- The TV marks each command `done` or `failed`. The phone shows an error if a command is still `pending` after 5s.
- The TV ignores commands older than 30s, so a stale command can't start playback later.
- Security rules: a user can read and write only their own `devices`, `sessions`, and `events` records.

## Events to log
`browse_open`, `row_scroll`, `search`, `title_view`, `send_to_tv`, `playback_start`, `abandon` (left without choosing), with `variant` set on each.

## Milestones
| # | Milestone | Estimate |
|---|---|---|
| 1 | Firebase project, auth, both routes rendering | 1 evening |
| 2 | TMDB rows + detail on the phone page | 1 day |
| 3 | TV page: arrow-key rows + trailer player | 1 day |
| 4 | Send to TV via Firestore commands | 1 day |
| 5 | Event logging + time-to-play results page | 1 evening |
| 6 | Run the 10–15 person test; write the README | 1 weekend |

## README must include
- The problem and the "remote, not casting" thesis
- An architecture diagram (phone → Firestore → TV)
- Key tradeoffs: why real-time Firestore rather than WebSockets; why trailers only; why in-app volume only
- Test method and real results, including anything that didn't work
- TMDB attribution (required by TMDB's terms): "This product uses the TMDB API but is not endorsed or certified by TMDB."

## Resume bullets (fill only with real results)
- Prototyped a TV-style browse experience on TMDB titles with a mood picker to help viewers choose what to watch
- Cut time-to-play [X]% in a [N]-person test comparing personalized rows alone against rows plus a mood picker
Rewrite both around phone-to-TV once the build matches this spec. Keep each under 113 characters.
