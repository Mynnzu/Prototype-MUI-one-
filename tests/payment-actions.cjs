const { connect } = require('./browser.cjs');
const assert = require('node:assert/strict');
(async () => {
  const b = await connect();
  const click = text => b.evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')];const button=buttons.find(item=>item.textContent.trim()===${JSON.stringify(text)});if(!button)throw new Error('Missing button');button.click()})()`);
  const setInput = (selector, value) => b.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.navigate', { url: 'http://127.0.0.1:4174/' });
    await b.until("document.querySelector('.bp-login-card')");
    await b.evaluate("Object.keys(localStorage).filter(key=>key.startsWith('buildpay-')).forEach(key=>localStorage.removeItem(key))");
    await click('Enter workspace'); await b.until("document.querySelectorAll('.bp-table tbody tr').length===3");
    await click('PA-2026-001'); await b.until("document.querySelector('#approved-amount')");
    await setInput('#executive-remarks', 'Verified test certification.');
    await setInput('#approved-amount', '120000'); await click('Accept');
    assert.equal(await b.evaluate('window.__bpTest.updates.length'), 0, 'Cannot approve more than certified');
    await setInput('#approved-amount', '100000'); await click('Accept');
    await b.until("window.__bpTest.updates.length===1 && !document.querySelector('[role=dialog]')");
    const result = await b.evaluate('window.__bpTest.records[0]');
    assert.equal(result.claimedAmountMYR, 125000, 'Approval preserves original claim');
    assert.equal(result.certifiedAmountMYR, 100000, 'Approved amount reaches finance');
    assert.equal(result.workflowStatusKey, 'Approved');
    assert.ok(!(await b.evaluate("'claimedAmountMYR' in window.__bpTest.updates[0].changedFields")));
    await b.evaluate(`localStorage.setItem('buildpay-finance-PA-2026-005',JSON.stringify({taxInvoiceNumber:'INV-TEST',taxInvoiceDate:'2026-09-20',bankName:'Test bank',bankAccountNumber:'123456789',paymentMethod:'EFT / Bank Transfer',paymentReferenceNo:'TEST-REF',withholdingTaxAmount:0,disbursedAmount:120000,paymentStatus:'Payment Processing',syncStatus:'Pending Sync',sapDocumentNumber:''}));const select=document.querySelector('[aria-label="Workspace role"]');select.value='finance';select.dispatchEvent(new Event('change',{bubbles:true}));`);
    await b.until("document.querySelector('.bp-count')?.textContent==='3 pending'");
    await click('PA-2026-005'); await b.until("document.querySelector('#gross')");
    assert.ok((await b.evaluate("document.querySelector('[role=dialog]').innerText")).includes('approved amount RM 110,000.00'));
    await click('Mark paid & close');
    assert.equal(await b.evaluate('window.__bpTest.updates.length'), 1, 'Cannot disburse more than approved');
    await setInput('#gross', '110000'); await click('Mark paid & close');
    await b.until("window.__bpTest.updates.length===2 && !document.querySelector('[role=dialog]')");
    assert.equal(await b.evaluate('window.__bpTest.records[4].workflowStatusKey'), 'PaidClosed');
    assert.equal(await b.evaluate('window.__bpTest.records[4].claimedAmountMYR'), 125000);
    assert.equal(b.errors.length, 0, JSON.stringify(b.errors));
    console.log('PASS: approval ceiling, original claim preservation, approved value handoff, payment ceiling, and valid payment closure. Test fixtures only; no live writes.');
  } finally { b.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
