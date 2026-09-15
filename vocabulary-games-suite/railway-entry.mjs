const services = {
  'word-defusal': './game-1-ktane/server.mjs',
  'word-kitchen': './game-2-overcooked/server.mjs',
  'semantic-drop': './game-3-falling-blocks/server.mjs',
  'visual-studio': './game-4-skribbl/server.mjs'
};

const selected = process.env.GAME_SERVICE || 'word-defusal';
const entry = services[selected];

if (!entry) {
  console.error(`Unknown GAME_SERVICE "${selected}". Choose: ${Object.keys(services).join(', ')}`);
  process.exit(1);
}

if (!process.env.HOST) process.env.HOST = '0.0.0.0';

console.log(`Starting Railway game service: ${selected}`);
await import(entry);
