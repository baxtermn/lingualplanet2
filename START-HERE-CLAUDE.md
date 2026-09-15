# Lingual Planet — complete Claude integration handoff

This package contains the approved English Academy public landing-page mockup and all five vocabulary games prepared for later integration. Source dependencies are intentionally excluded; run `npm install` from the relevant package directories.

## Package contents

### `english-academy-landing/`

- Approved responsive landing page in `index.html`.
- Six optimized WebP photographs in `assets/`.
- Detailed page-specific instructions in `CLAUDE-HANDOFF.md`.
- Preserve the approved navy, wine-red, ivory, and pink palette and the final copy.

### `vocabulary-games-suite/`

Four standalone games sharing `shared/vocabulary-db.json`:

1. `game-1-ktane/` — Asymmetric Word Defusal.
2. `game-2-overcooked/` — Word Assembly Kitchen.
3. `game-3-falling-blocks/` — Semantic Grid Drop.
4. `game-4-skribbl/` — Visual Vocabulary Studio.

Read `README.md` for controls and local startup, and `INTEGRATION.md` for the host identity, vocabulary, result-record, and Socket.IO contracts.

Local suite startup:

```bash
cd vocabulary-games-suite
npm install
npm start
```

The launcher uses port 4100 and the games use ports 4101–4104. Run `npm test` for the existing integration tests.

For Railway, keep the root directory at `/vocabulary-games-suite` and use the default `npm start`. Set `GAME_SERVICE` independently on each Railway service to one of `word-defusal`, `word-kitchen`, `semantic-drop`, or `visual-studio`. The entry point starts only that server and defaults to `word-defusal` when the variable is omitted.

### `vocabulary-battleship/`

The upgraded Vocabulary Battleship application includes:

- Solo play against Captain Lexi.
- Isolated two-player matches.
- Classroom-only matchmaking for authenticated students.
- Worldwide matchmaking for individual accounts.
- Signed Lingual Planet launch tokens.
- Teacher controls, mobile 10×10 board, authoritative server outcomes, health/status endpoints, and production-scaling guidance.

Read `README.md`, `UPGRADE-NOTES.md`, and `CLAUDE.md` before integration.

Local startup:

```bash
cd vocabulary-battleship
npm install
npm start
```

The default local port is 3000.

## Recommended integration order

1. Integrate the English Academy landing page without altering authenticated dashboard behavior.
2. Establish one shared authenticated game-launch contract in Lingual Planet.
3. Import and expose the canonical vocabulary data from `vocabulary-games-suite/shared/vocabulary-db.json` through the host content API.
4. Integrate each of the four suite games behind separate authenticated routes.
5. Integrate Battleship using its signed launch-token flow and account/classroom matchmaking rules.
6. Route all completion records into the existing learner record and teacher reporting systems.
7. Move multiplayer presence, queues, room state, and locks to Redis before horizontal scaling. Use sticky WebSocket sessions during migration.
8. Apply production authentication, CSRF/origin controls, rate limiting, moderation, accessibility checks, and load tests before public launch.

## Non-negotiable identity rules

- Never trust browser-supplied learner IDs, roles, teacher IDs, or classroom IDs.
- Derive identity and classroom membership from the authenticated Lingual Planet server session or a short-lived signed launch token.
- Classroom students may choose only solo play or another currently connected student in their own classroom.
- Individual accounts may choose solo play or the worldwide individual matchmaking pool.
- Teachers administer classroom activity but are not silently inserted into student matchmaking.
- No classroom or public matchmaking queue may share an unscoped global room identifier.

## Deployment notes

- Do not copy any `node_modules` directory into production. Install from the included lockfiles.
- The current multiplayer room stores are suitable for local validation and a single Node process. Redis/shared state is required for reliable multi-instance worldwide deployment.
- Mount games as dedicated routes or services and preserve their namespaced Socket.IO events.
- Replace placeholder links in the landing page with production routes.
- Confirm CSP/font handling for the landing page's Google Fonts or self-host the fonts.
- Test desktop, tablet, 390px mobile, two-client multiplayer, reconnects, timer expiry, classroom isolation, and unauthorized teacher actions.
