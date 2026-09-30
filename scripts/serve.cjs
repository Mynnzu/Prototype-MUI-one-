const { createFixtureServer } = require('../tests/fixture-server.cjs');
const server = createFixtureServer({ preview: true });
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('BuildPay local demo is already running at http://127.0.0.1:4173');
    process.exit(0);
  }
  throw err;
});
server.listen(4173, '127.0.0.1', () => {
  console.log('BuildPay local workspace: http://127.0.0.1:4173');
  console.log('Direct access enabled. Uses sample data only; no Power Apps sign-in required.');
});
