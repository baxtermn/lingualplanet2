# Host integration contract

This package is deliberately identity-provider and database neutral. Medicomskills or English Academy should provide the authenticated shell and inject these values when mounting a game:

```js
window.LINGUAL_PLANET = {
  learner: { id: "host-user-id", displayName: "Learner" },
  vocabularyEndpoint: "/api/v1/vocabulary",
  resultsEndpoint: "/api/v1/learning-records",
  socketPath: "/socket.io",
  authToken: "short-lived-host-token"
};
```

Completion records follow the factory in `shared/integration-adapter.mjs`:

```json
{
  "type": "lingual-planet.game.completed",
  "version": 1,
  "gameId": "word-kitchen",
  "vocabularyId": "unreadable",
  "score": 420,
  "attempts": 2,
  "durationMs": 87000,
  "metadata": {},
  "completedAt": "ISO-8601 timestamp"
}
```

The host should derive learner identity from the authenticated session rather than trusting an ID in the browser payload. Enforce authorization and curriculum access when returning vocabulary. Namespace Socket.IO events exactly as implemented, use a shared adapter such as Redis when horizontally scaled, and configure sticky connections at the load balancer.

For React integration, mount each existing `public/index.html` body as a route component and place the corresponding `app.js` state behind a feature-local reducer. Canvas engines do not depend on the DOM outside their named controls. Multiplayer server handlers can be registered from the existing `server.mjs` files into the host Socket.IO bootstrap.
