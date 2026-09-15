# Vocab Battleship — instructions for Claude Code

This folder is the current production code for **Vocab Battleship**, a
speaking-based medical vocabulary game (Node + Express + Socket.io, vanilla
JS client). It is live at `vocabbattle-production.up.railway.app` and is to be
integrated into the owner's **Lingual Planet** website.

Read this whole file before touching code. The pedagogy matters more than the
game: every turn exists to make the student **say two vocabulary words out
loud**. Do not add any feature that lets a turn complete without speech.

---

## 1. What exists today (do not break)

| File | Role |
|---|---|
| `server.js` | All game state, pairing, turn logic, power-ups, vocab pools, teacher events |
| `public/index.html` | Student client (login → wait → paired → place ships → play) |
| `public/teacher.html` | Teacher dashboard (vocab setup, pairing, pause/announce, export log) |
| `public/socket.io.min.js`, `public/bgm.mp3` | Vendored client lib and background music |

Key facts about the current implementation:

- Grid is **15 × 15**. Column headers are `vocabX`, row headers are `vocabY`.
  Definitions live in `defsX` / `defsY`, index-aligned with the terms.
- Teachers may enter more than 15 terms per axis; `pick15()` (server) draws a
  random matched set per room. A **10-minute `vocabRefresh`** swaps axis labels
  mid-game while preserving hit/miss state.
- Ships: battleship 5, destroyer 4, cruiser 3, sub1 2, sub2 2.
- Rooms hold **2 or 3 players** (trio if the class count is odd). Turns rotate
  A→B→C→A; the defender is always the player after the attacker.
- **Attack flow** (multiplayer):
  1. attacker clicks a cell → `selectSquare`
  2. server sets `room.pendingAttack`, emits `speakPrompt` to attacker and
     `defendPrompt` to defender (with `wordX`, `wordY`, `row`, `col`)
  3. attacker reads the sentence aloud in person
  4. defender clicks Hit/Miss → `defendAnswer` → server checks the **real**
     grid (`room.grids[defenderId][row][col]`), ignoring what the defender
     claimed, and emits `attackResult`
- Client already uses `speechSynthesis` (TTS reads the sentence; different
  voice per attacker index). There is **no speech recognition** yet.
- Mobile (`IS_MOBILE`, `max-width:768px`): sidebar hidden, two tabbed grids
  (`mobileAtkWrap` / `mobileMyWrap`), a bottom sheet for options, and a
  `coordBanner` that shows the chosen words. Headers are 9px and truncated
  with ellipsis — this is the source of the coordinate-reading problem.

Multiplayer must keep working exactly as it does now. Teachers run it in
class; nothing about pairing, the dashboard, the log export, or the 10-minute
refresh may change behaviour.

---

## 2. What to build

### 2.1 Mode selection

Add a mode choice **before** login on `index.html`:

- **Play with classmates** — existing flow, unchanged.
- **Practice alone** — new solo mode against the computer.

Solo mode needs no teacher, no pairing, and no room on the server other than
a lightweight per-socket solo room (or run it fully client-side — either is
acceptable, but see §2.6 on vocabulary and logging before choosing).

Solo mode must use the **same current vocabulary** the teacher has set
(`gameSettings.vocabX/Y`, `defsX/Y`, and `pick15()`), so a student practising at
home sees the words from class. Keep the 10-minute refresh in solo mode too.

### 2.2 Speech recognition — attacker turn (student attacks)

1. Student taps a cell (same `clickAtk` path; keep the pending highlight).
2. Prompt card shows the target sentence
   `Is there something at <X> and <Y>?` — respecting `showPrompt` and
   `hardMode` (hard mode hides the sentence; the student must produce it
   from the grid).
3. Mic starts listening (Web Speech API `SpeechRecognition` /
   `webkitSpeechRecognition`, `lang = 'en-US'`, `interimResults = true`).
4. Accept the turn when the transcript contains **both** target terms.
   Matching rules:
   - case-insensitive; strip punctuation
   - accept the exact term or any recognition alternative (`maxAlternatives = 5`)
   - fuzzy-match each term with a normalised Levenshtein distance ≤ 0.25
     (medical terms are mangled often: "thoracotomy" → "the rock otomy").
     Also compare against a space-stripped transcript.
   - the frame words ("is there something at … and") are **not** required —
     the vocabulary is what matters
5. On success: show a "✅ Heard: *thoracotomy* and *bursitis*" confirmation,
   then resolve the shot against the computer's grid and show hit/miss with
   the existing sounds and animations.
6. On failure (timeout ~8 s, or transcript without both words): show what was
   heard, highlight which of the two words was missing, and offer
   **Try again** (default) and **Hear it** (TTS of the sentence, reusing
   `doSpeak`). After **3 failed attempts**, offer **Type it** — the student
   must type both words; typing is a fallback, never the first option.
7. Do not fire the shot on a tap alone. The tap only selects; speech fires.

### 2.3 Speech recognition — defender turn (computer attacks)

The student must also speak when defending. This doubles spoken output and is
explicitly wanted.

1. Computer picks a target (see §2.5), and the client:
   - highlights the targeted cell on **My Grid** with a pulsing outline and
     scrolls it into view (on mobile, switch to the `my` tab automatically)
   - shows a **magnified inset** on the defend bar: a 3×3 (or 5×5 on desktop)
     zoom of the cells around the target, ship segments visible, target cell
     centred, with both words and (if `showDefs`) both definitions
   - TTS speaks "Is there something at X and Y?" in the computer's voice
2. Student answers by voice: **"hit"** or **"miss"** (also accept
   "yes"/"no", "there is"/"there isn't", "hit!", "a hit"). Keep Hit/Miss
   buttons on screen as fallback, but they only become active after one
   failed recognition attempt.
3. The game **verifies against the real grid**. If the student's answer is
   wrong, show a correction: "Actually that's a **hit** — your ship is at
   *fracture* / *suture*", mark the cell truthfully, and continue. Log the
   mismatch (see §2.6). The student cannot corrupt game state by misreading
   the grid; the speaking still happens.

### 2.4 Mobile coordinate readability

Root cause: 15 columns of 9px, ellipsised headers. Fix it in both modes:

- Pin the row-header column and column-header row (sticky) so axis words stay
  visible while scrolling.
- Make the grid horizontally scrollable with larger cells (≥ 34px) instead of
  squeezing 15 columns into the viewport; do not truncate header text —
  wrap or rotate instead.
- When a cell is selected (attacker) or targeted (defender), always show the
  full untruncated words in the prompt/defend bar **and** the magnified inset
  from §2.3. The student should never need to read the small headers to know
  what to say.
- Tap on any header shows the full term + definition (extend the existing
  `showTermPopup`).

### 2.5 Computer opponent

- Places its five ships randomly (reuse the client's auto-place logic or the
  server's validation — no overlaps, in bounds).
- Targeting: random until a hit, then **hunt mode** — try the four
  orthogonal neighbours, follow the line once two hits align, return to
  random after a sink. Keep it beatable; this is a vocabulary drill, not a
  chess engine.
- Add a 1–2 s "thinking" delay before it attacks so the turn change is
  legible.
- Power-ups: available to the student in solo mode exactly as in multiplayer.
  The computer does not use them.

### 2.6 Logging and vocabulary source

- Log every solo turn to the same `activityLog` shape the teacher exports
  (`time, attackerName, wordX, wordY, result, room`) plus new fields:
  `mode: 'solo'`, `role: 'attack'|'defend'`, `attempts`, `heard` (final
  transcript), `defendAnswerCorrect` (defender turns only). If solo mode is
  client-side, POST turns to a small `/api/solo-log` endpoint.
- The teacher dashboard should show a **Solo practice** counter and include
  solo rows in the CSV export.

### 2.7 Browser support

- Web Speech API works in Chrome, Edge, Safari (iOS 14.5+). Firefox does not
  support it. Detect support on the mode-select screen; if absent, show a
  notice and let solo mode fall back to type-to-fire (still require both
  words typed — no click-only turns).
- Mic permission must be requested on a user gesture (the first tap on a
  cell), not on page load.
- On iOS Safari, `SpeechRecognition` and `speechSynthesis` cannot overlap;
  stop TTS before starting recognition and vice versa.

---

## 3. Lingual Planet integration

The owner will supply the Lingual Planet site details. Design for:

- Serving the game under a path such as `/games/vocab-battleship/` (make all
  asset and socket paths relative or configurable via a `BASE_PATH` env var;
  `socket.io` needs `path: BASE_PATH + '/socket.io'` on both sides).
- Reading the student identity from the parent site if a shared login exists
  (accept `?sid=&name=&class=` query params or a `postMessage` from an
  embedding iframe); fall back to the current login form.
- Keeping the Node server deployable on Railway as today (`PORT` from env).

Do not couple the game to any specific CMS until the owner confirms what
Lingual Planet runs on.

---

## 4. Working rules

- Owner preference: when a file changes, deliver the **complete rewritten
  file**, not line-by-line edit instructions.
- Keep `index.html` single-file (inline CSS/JS) unless the owner agrees to
  split it.
- Run `npm install && node server.js` and test multiplayer with two browser
  tabs **and** solo mode in Chrome on a phone-width viewport before declaring
  anything done.
- Suggested order: §2.4 (mobile readability) → §2.1 → §2.5 → §2.2 → §2.3 →
  §2.6 → §2.7 → §3.
