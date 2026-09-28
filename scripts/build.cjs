const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const packagePath = 'CanvasApps/cr44f_buildpayenterpriseportal_81f53_CodeAppPackages';
const primary = path.join(root, packagePath);
const mirror = path.join(root, 'src/GitHubProject2', packagePath);
const jsName = 'assets/index-Cum7pg08.js';
const cssName = 'assets/index-CN98kS3T.css';
let bundle = fs.readFileSync(path.join(primary, jsName), 'utf8');
function replaceOnce(from, to) {
  if (bundle.includes(to) && (!bundle.includes(from) || to.includes(from))) return;
  if (bundle.split(from).length !== 2) throw new Error('Expected exactly one bundle anchor: ' + from.slice(0, 120));
  bundle = bundle.replace(from, to);
}
function injectSection(name, start, end, file) {
  const open = `/* BUILDPAY ${name} START */`, close = `/* BUILDPAY ${name} END */`;
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const first = bundle.includes(open) ? bundle.indexOf(open) : bundle.indexOf(start);
  const last = bundle.includes(close) ? bundle.indexOf(close) + close.length : bundle.indexOf(end, first);
  if (first < 0 || last < first) throw new Error('Missing section: ' + name);
  bundle = bundle.slice(0, first) + open + '\n' + source + '\n' + close + bundle.slice(last);
}
// Keep the host SDK, generated Dataverse services and existing role forms intact.
injectSection('WORKSPACE', 'function A2e()', 'function k2e()', 'web/workspace.js');
injectSection('LOGIN', 'function O2e()', 'function P2e()', 'web/login.js');

// Explicit component inputs make dashboard actions open the actual existing forms.
for (const [name, data, opener, allowed] of [
  ['iH', 't', 'oe', 'X'], ['E2e', 'o', 'B', '$'], ['lBe', 't', 'k', 'N'], ['o2e', 't', 'A', 'N']
]) {
  const signature = `function ${name}({selectedId=null,openCreate=false}={}){`;
  replaceOnce(`function ${name}(){`, signature);
  const begin = bundle.indexOf(signature);
  const beforeReturn = bundle.indexOf(';return g.jsxDEV(', begin);
  const marker = `/* BP_OPEN_${name} */`;
  if (!bundle.slice(begin, beforeReturn + 1000).includes(marker)) {
    const hook = `;${marker}const bpOpened=D.useRef(false);D.useEffect(()=>{if(bpOpened.current)return;${name === 'iH' ? 'if(openCreate){bpOpened.current=true;B();return;}' : ''}const record=${allowed}.find(item=>item.id===selectedId);if(record){bpOpened.current=true;${opener}(record)}},[selectedId,openCreate,${data}])`;
    bundle = bundle.slice(0, beforeReturn) + hook + bundle.slice(beforeReturn);
  }
}

// Approval must preserve the original claim and use the persisted certified value.
bundle = bundle.replace(/(?:!Number\.isFinite\(p\.finalApprovedAmount\)\|\|)+/g, '!Number.isFinite(p.finalApprovedAmount)||');
replaceOnce('claimedAmountMYR:p.finalApprovedAmount,certifiedAmountMYR:p.finalApprovedAmount', 'certifiedAmountMYR:p.finalApprovedAmount');
replaceOnce('certifiedAmount:r.calculations?.final??e.claimedAmountMYR', 'certifiedAmount:e.certifiedAmountMYR??r.calculations?.final??e.claimedAmountMYR');
replaceOnce('return{certifiedAmount:e.claimedAmountMYR,reviewerNotes:e.certificateNumber', 'return{certifiedAmount:e.certifiedAmountMYR??e.claimedAmountMYR,reviewerNotes:e.certificateNumber');
replaceOnce('p.finalApprovedAmount<=0||p.finalApprovedAmount>p.certifiedAmount', '!Number.isFinite(p.finalApprovedAmount)||p.finalApprovedAmount<=0||p.finalApprovedAmount>p.certifiedAmount');
// Use the certified/approved value in finance after preserving the submitted amount.
const financeStart = bundle.indexOf('function o2e('), financeEnd = bundle.indexOf('function Oy(', financeStart);
let finance = bundle.slice(financeStart, financeEnd);
finance = finance.replaceAll('QY(U.claimedAmountMYR)', 'QY(U.certifiedAmountMYR??U.claimedAmountMYR)');
finance = finance.replaceAll('U+$.claimedAmountMYR', 'U+($.certifiedAmountMYR??$.claimedAmountMYR)');
finance = finance.replaceAll('Kp(c?.claimedAmountMYR??0)', 'Kp(c?.certifiedAmountMYR??c?.claimedAmountMYR??0)');
const oldValidation = 'p.disbursedAmount<=0||p.withholdingTaxAmount<0||p.withholdingTaxAmount>=p.disbursedAmount';
const newValidation = '!Number.isFinite(p.disbursedAmount)||!Number.isFinite(p.withholdingTaxAmount)||p.disbursedAmount<=0||p.disbursedAmount>(c.certifiedAmountMYR??c.claimedAmountMYR)||p.withholdingTaxAmount<0||p.withholdingTaxAmount>=p.disbursedAmount';
if (!finance.includes(newValidation)) finance = finance.replace(oldValidation, newValidation);
bundle = bundle.slice(0, financeStart) + finance + bundle.slice(financeEnd);
// Honor hosted subdirectories and query parameters instead of rewriting the host URL to '/'.
const routerBefore = 'g.jsxDEV(use,{basename:window.location.pathname.replace(/\\/[^/]*$/,"/").replace(/\\/$/,"")||"/",children:g.jsxDEV($oe,';
const routerAfter = 'g.jsxDEV(use,{basename:window.location.pathname.replace(/\\/$/,"")||"/",children:g.jsxDEV($oe,';
if (bundle.includes(routerBefore)) bundle = bundle.replace(routerBefore, routerAfter);
else replaceOnce('g.jsxDEV(use,{children:g.jsxDEV($oe,', routerAfter);

const cssMarker = '/* BUILDPAY DESIGN SYSTEM */';
const css = fs.readFileSync(path.join(primary, cssName), 'utf8').split(cssMarker)[0].trimEnd() + '\n' + cssMarker + '\n' + fs.readFileSync(path.join(root, 'web/portal.css'), 'utf8');
let html = fs.readFileSync(path.join(primary, 'index.html'), 'utf8')
  .replace('<title>App Builder</title>', '<title>BuildPay · Payment workspace</title>')
  .replace(/\s*<script>history\.replaceState\(\{\}, '', '\/'\);<\/script>/, '');
for (const folder of [primary, mirror]) {
  fs.writeFileSync(path.join(folder, jsName), bundle);
  fs.writeFileSync(path.join(folder, cssName), css);
  fs.writeFileSync(path.join(folder, 'index.html'), html);
}
console.log('Built BuildPay UI and synchronized both Power Platform package copies.');
