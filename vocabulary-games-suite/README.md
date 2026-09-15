# Lingual Planet — Standalone Vocabulary Games

Four isolated browser games sharing a single, integration-ready vocabulary model. Node.js 18+ and npm are required. No API keys or external services are needed.

The suite now includes 24 curriculum entries, a unified arcade launcher, reconnect-tolerant multiplayer rooms, bounded chat/drawing payloads, local score persistence, sound and reduced-motion preferences, touch controls, automated integration tests, and container configuration.

## Run

Each app installs and starts independently:

```bash
cd game-1-ktane && npm install && npm start       # http://localhost:4101
cd game-2-overcooked && npm install && npm start  # http://localhost:4102
cd game-3-falling-blocks && npm install && npm start # http://localhost:4103
cd game-4-skribbl && npm install && npm start     # http://localhost:4104
```

Or install once at the root and launch the complete arcade:

```bash
npm install
npm start  # launcher on http://localhost:4100; games on 4101–4104
npm test
```

For multiplayer games, open the same room URL in two browser tabs or devices. Game 1 assigns Defuser and Instructor roles. Game 4 rotates the drawer and supports live strokes, chat, synonym-aware scoring, and round progression.

## Architecture

- `shared/vocabulary-db.json` is the canonical content source. Every entry has an ID, complete word, prefix/root/suffix, definition, synonyms, antonyms, and drawing prompt.
- Games 1 and 4 use Express + Socket.IO and server-authoritative room state. Socket event payloads are small JSON objects and rooms are in-memory, intentionally making later replacement with Redis or an existing session layer straightforward.
- Games 2 and 3 use deterministic Canvas loops with plain ES modules and keep gameplay state local to the feature, matching the simple state-object/event-handler pattern found in the accessible local Node application.
- Every app exposes `GET /health`; multiplayer apps also expose `GET /api/vocabulary`.
- The requested local repository named “Lingual Academy” was not present in the readable filesystem on 2026-09-15. No existing repository was modified. Alignment therefore uses the observable local conventions: Node ES modules, Express static delivery, small JSON APIs, explicit state maps, and framework-free browser state.

The public references were used as conceptual—not copied—patterns: separated game-state/render layers and timed state transitions from KTANE-style play; grid movement, stations, held items, assembly, and delivery from Overcooked; collision-driven semantic clearing rather than standard line clearing from RegExtris; and Socket.IO rooms, stroke relaying, turns, and chat validation from Skribbl clones.

## Later integration into Medicomskills / English Academy

1. Copy `shared/vocabulary-db.json` into the host content/data package and preserve entry IDs. Prefer exposing it through the host's authenticated content API rather than duplicating it per game.
2. Mount each game under a distinct route (`/games/word-defusal`, `/games/word-kitchen`, `/games/semantic-drop`, `/games/visual-studio`). Rewrite asset paths or serve `/shared/theme.css` at a stable shared URL.
3. Move `server.mjs` room handlers from Games 1 and 4 into the host Socket.IO bootstrap. Keep event names namespaced (`ktane:*`, `studio:*`) to avoid collisions. Replace anonymous socket IDs with the host learner/session ID.
4. Replace the in-memory `Map` room stores with the host's room/session repository (or Redis for horizontal scaling). Persist only round results, scores, and vocabulary entry IDs; drawing strokes and timers are ephemeral.
5. Wrap each browser `app.js` as a route component. State is deliberately contained in one object, so migrate it to React `useReducer`/context or the host's current store without changing the game protocol.
6. Send completion events to the learning-record layer with `{gameId, vocabularyId, score, attempts, durationMs}`. Apply host authentication, CSRF/origin policy, rate limiting, moderation, and accessibility standards before production release.
7. Run two-client integration tests for reconnects, room cleanup, duplicate guesses, and timer expiry. Configure sticky sessions or a Socket.IO Redis adapter when deployed across multiple instances.

## Controls

- Word Defusal: click morphemes; Instructor searches the manual and relays the key.
- Word Kitchen: arrows/WASD move, `E` interacts, `R` resets.
- Semantic Grid Drop: arrows/A/D move, up/W rotates, down/S soft drops, space hard drops.
- Visual Studio: drag to draw; Enter sends a guess; drawer can clear the canvas.
