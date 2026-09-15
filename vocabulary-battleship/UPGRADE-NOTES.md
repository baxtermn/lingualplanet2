# Upgrade notes

## Completed

- Added a choice between isolated two-player classroom matches and solo practice.
- Added Captain Lexi, a server-controlled solo opponent with an automatically placed fleet and independent turns.
- Changed automatic and manual classroom pairing to exactly two learners per room.
- Reduced the board from 15×15 to 10×10 for usable phone-sized tap targets.
- Added A–J and 1–10 mobile coordinates with full vocabulary revealed on interaction.
- Refined colour contrast, spacing, cards, entry flow, touch sizing, and small-screen layout.
- Kept full vocabulary labels on desktop with safe truncation for unusually long terms.
- Added signed, five-minute Lingual Planet launch tokens for trusted identity handoff.
- Added signed account roles, classroom IDs, and teacher IDs.
- Isolated each classroom's waiting pool; classroom students cannot match with outsiders.
- Added a separate worldwide pool for individual accounts.
- Added configurable CORS restrictions, teacher-dashboard authentication, `/healthz`, and expanded `/api/status`.
- Made hit and miss resolution server-authoritative.
- Fixed recursive room deletion, an undefined audio-context error, and incorrect mobile grid switching after a solo turn.

## Production follow-up

- Provide the final public game URL and environment variables on the production host.
- Add the token request and redirect to Lingual Planet's authenticated backend.
- Move presence, matchmaking queues, room state, and turn locks to Redis before running multiple Node processes.
- Load-test on the intended host using the school's expected peak class count.
- Add persistent lesson presets if teachers need vocabulary banks to survive server restarts.
