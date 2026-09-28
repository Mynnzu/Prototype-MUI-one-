// Optional browser checks using an existing local Chromium debugging port, no npm dependencies.
const fs = require('node:fs');
const assert = require('node:assert/strict');
async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
  const socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0; const calls = new Map(); const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const pending = calls.get(message.id); calls.delete(message.id); message.error ? pending.reject(message.error) : pending.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  });
  function send(method, params = {}) { return new Promise((resolve, reject) => { calls.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
  async function until(expression) { for (let index = 0; index < 80; index++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error('Timed out: ' + expression); }
  async function screenshot(name) { const { data } = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync('.artifacts', { recursive: true }); fs.writeFileSync(`.artifacts/${name}.png`, Buffer.from(data, 'base64')); }
  await send('Runtime.enable'); await send('Page.enable');
  return { send, evaluate, until, screenshot, errors, close: () => socket.close() };
}
module.exports = { connect };
if (require.main === module) (async () => {
  const browser = await connect();
  try {
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await browser.until("document.querySelector('.bp-login-card')");
    await browser.screenshot('login-desktop');
    await browser.evaluate("document.querySelector('.bp-login-card > button').click()");
    await browser.until("document.querySelector('.bp-app')");
    await browser.screenshot('overview-desktop');
    console.log(await browser.evaluate('document.body.innerText'));
    console.log('Runtime exceptions:', JSON.stringify(browser.errors));
  } finally { browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
