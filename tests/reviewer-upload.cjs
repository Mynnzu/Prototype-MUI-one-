const { connect } = require('./browser.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const file = path.resolve('.artifacts/reviewer-upload-test.txt');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'Reviewer evidence\n' + 'A'.repeat(4096));
  const browser = await connect();
  const click = label => browser.evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===${JSON.stringify(label)});if(!button)throw new Error('Button not found: ${label}');button.click()})()`);
  try {
    await browser.send('Page.navigate', { url: 'http://127.0.0.1:4174/hosted/app/index.html' });
    await browser.until("document.querySelector('.bp-login-card')");
    await click('Enter workspace');
    await browser.until("document.querySelector('[aria-label=\"Workspace role\"]')");
    await browser.evaluate("(()=>{const select=document.querySelector('[aria-label=\"Workspace role\"]');select.value='reviewer';select.dispatchEvent(new Event('change',{bubbles:true}))})()");
    await browser.until("document.querySelector('.bp-count')?.textContent==='3 pending'");
    await click('PA-2026-003');
    await browser.until("document.querySelector('[role=dialog] input[type=file]')");
    const { root } = await browser.send('DOM.getDocument');
    const { nodeId } = await browser.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[role=dialog] input[type=file]' });
    assert.ok(nodeId);
    await browser.send('DOM.setFileInputFiles', { nodeId, files: [file] });
    await browser.until("document.querySelector('[role=dialog]')?.innerText.includes('reviewer-upload-test.txt (this browser only)')");
    assert.ok(!(await browser.evaluate("document.querySelector('[role=dialog]').innerText.includes('No reviewer evidence attached.')")));
    await browser.evaluate("document.querySelector('[role=dialog] button[data-slot=dialog-close]').click()");
    await browser.until("!document.querySelector('[role=dialog]')");
    await click('Open review');
    await browser.until("document.querySelector('[role=dialog]')?.innerText.includes('reviewer-upload-test.txt (this browser only)')");
    assert.equal(browser.errors.length, 0, JSON.stringify(browser.errors));
    console.log('PASS: reviewer uploads a document beyond the Dataverse text limit and can reopen it.');
  } finally { browser.close(); fs.rmSync(file, { force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
