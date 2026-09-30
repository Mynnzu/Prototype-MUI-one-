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
function replaceRegexOnce(pattern, to) {
  if (bundle.includes(to)) return;
  const matches = bundle.match(pattern);
  if (!matches || matches.length !== 1) throw new Error('Expected exactly one bundle regex anchor: ' + pattern);
  bundle = bundle.replace(pattern, to);
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
// Host context can remain pending when opened outside Power Apps. Bound the
// request so access fails closed with a working retry instead of loading forever.
replaceOnce('const mb=()=>Hi({queryKey:["user"],queryFn:async()=>(await gce()).user})', 'const mb=()=>Hi({queryKey:["user"],queryFn:()=>bpLoadUser(),retry:!1,networkMode:"always"})');
injectSection('REVIEWER_HELPERS', 'const Sk=e=>', 'function E2e(', 'web/reviewer-attachments.js');

// The submitter queue must use the signed-in identity, including when user
// context or an older record has no email address.
replaceOnce('e?.userPrincipalName??"farhan.a@peninsular-eng.com"', 'e?.userPrincipalName??""');
replaceOnce('j.submitterIdentity.toLowerCase()===$.toLowerCase()', '(j.submitterIdentity??"").toLowerCase()===$.toLowerCase()');

// The exported ReviewAttachment file content column is limited to 2,000 chars.
// Use browser storage for larger files and show its limited scope in the dialog.
replaceOnce(
  'k=m.filter(ue=>ue.paymentApplication?.id===w?.id)',
  'bpLocalEvidenceState=D.useState([]),bpLocalEvidence=bpLocalEvidenceState[0],bpSetLocalEvidence=bpLocalEvidenceState[1],bpUploadState=D.useState(false),bpUploading=bpUploadState[0],bpSetUploading=bpUploadState[1],k=[...m.filter(ue=>ue.paymentApplication?.id===w?.id),...bpLocalEvidence.filter(ue=>ue.paymentApplication?.id===w?.id)]'
);
replaceRegexOnce(
  /ye=async ue=>\{[\s\S]*?\}(?=,De=async ue=>)/,
  fs.readFileSync(path.join(root, 'web/reviewer-upload.js'), 'utf8').trim()
);
replaceOnce(
  '/* BP_OPEN_E2e */',
  'D.useEffect(()=>{let active=true;bpSetLocalEvidence([]);if(w?.id)bpLoadReviewerEvidence(w.id).then(records=>{if(active)bpSetLocalEvidence(records)}).catch(error=>{if(active)Ot.error(error instanceof Error?error.message:"Saved documents could not be loaded.")});return()=>{active=false}},[w?.id]);/* BP_OPEN_E2e */'
);
replaceOnce(
  'disabled:p.isPending,onClick:()=>v.current?.click()',
  'disabled:bpUploading,onClick:()=>v.current?.click()'
);
replaceOnce('p.isPending?"Uploading…":"Add attachment"', 'bpUploading?"Uploading…":"Add attachment"');
replaceOnce(
  'children:"IV, QS Report, and Payment Certificate (Architect) are mandatory before recommendation."',
  'children:"IV, QS Report, and Payment Certificate (Architect) are mandatory before recommendation. Some files are saved only in this browser; the attachment list will identify them."'
);
replaceOnce(
  'children:ue.fileName},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/reviewer-dashboard.tsx",lineNumber:237,columnNumber:5449}',
  'children:ue.storageScope==="browser"?`${ue.fileName} (this browser only)`:ue.fileName},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/reviewer-dashboard.tsx",lineNumber:237,columnNumber:5449}'
);

// Live Dataverse attachments can exist without a related payment application.
replaceOnce('ue.paymentApplication.id===w?.id', 'ue.paymentApplication?.id===w?.id');

// Restore submitter document metadata after reopening a saved draft or submission.
replaceOnce(
  'x(j),w(ee),T([]),m(!0)',
  'x(j),w(ee),T(()=>{try{const ne=JSON.parse(localStorage.getItem(`buildpay-documents-${j.claimReference}`)??"[]");return Array.isArray(ne)?ne:[]}catch{return[]}}),m(!0)'
);

// Keep previewable file data when saving and expose preview before download/removal.
replaceOnce(
  'previewUrl:be.type.startsWith("image/")?await _2e(be):void 0',
  'previewUrl:await _2e(be)'
);
bundle = bundle.replace('window.open(j.previewUrl,"_blank","noopener,noreferrer")', 'window.open(j.previewUrl,"_blank")');
replaceOnce(
  'ae&&g.jsxDEV(Pt,{type:"button",variant:"ghost",size:"icon-sm",onClick:()=>T(O=>O.filter(ee=>ee.id!==j.id)),children:g.jsxDEV(sG,{},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/submitter-dashboard.tsx",lineNumber:163,columnNumber:1135},this)},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/submitter-dashboard.tsx",lineNumber:163,columnNumber:957},this)',
  'g.jsxDEV(Pt,{type:"button",variant:"outline",size:"sm",onClick:()=>{if(!j.previewUrl||!(j.type==="application/pdf"||j.type.startsWith("image/"))){Ot.error("This file type cannot be previewed in the browser.");return}const ne=window.open(j.previewUrl,"_blank");if(!ne)Ot.error("Allow pop-ups to preview this file.")},children:"Preview"},void 0,!1),ae&&g.jsxDEV(Pt,{type:"button",variant:"ghost",size:"icon-sm",onClick:()=>T(O=>O.filter(ee=>ee.id!==j.id)),children:g.jsxDEV(sG,{},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/buildpay-enterprise-portal/src/components/submitter-dashboard.tsx",lineNumber:163,columnNumber:1135},this)},void 0,!1,{fileName:"/workspace/project/apps/buildpay-enterprise-portal/src/components/buildpay-enterprise-portal/src/components/submitter-dashboard.tsx",lineNumber:163,columnNumber:957},this)'
);

// Replace submitter selectors with editable text fields, while resolving matching records.
if (!bundle.includes('placeholder:"Enter project name or code"')) {
  replaceRegexOnce(
    /g\.jsxDEV\(Ii,\{disabled:!ae,value:N\.projectId[\s\S]*?lineNumber:159,columnNumber:69\},this\)/,
    'g.jsxDEV(di,{disabled:!ae,value:N.projectName??"",placeholder:"Enter project name or code",onChange:j=>{const O=j.target.value.trim().toLowerCase(),ee=i.find(ne=>ne.id&&ne.activeStatusKey==="Active"&&((ne.projectName??"").toLowerCase()===O||(ne.projectCode??"").toLowerCase()===O));w(ne=>({...ne,projectName:j.target.value,projectId:ee?.id??"",contractorPartyId:"",contractId:"",packageId:""}))}},void 0,!1,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:69},this)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:69},this)'
  );
  replaceRegexOnce(
    /g\.jsxDEV\(Ii,\{disabled:!ae\|\|!N\.projectId,value:N\.contractorPartyId[\s\S]*?lineNumber:159,columnNumber:883\},this\)/,
    'g.jsxDEV(di,{disabled:!ae,value:_?.organizationName??"",placeholder:"Enter contractor name",onChange:j=>{const O=j.target.value.trim().toLowerCase(),ee=A.find(ne=>ne.id&&(ne.organizationName??"").toLowerCase()===O);w(ne=>({...ne,contractorPartyId:ee?.id??""}))}},void 0,!1,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:883},this)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:883},this)'
  );
  replaceRegexOnce(
    /g\.jsxDEV\(Ii,\{disabled:!ae\|\|!N\.projectId,value:N\.contractId[\s\S]*?lineNumber:159,columnNumber:1525\},this\)/,
    'g.jsxDEV(di,{disabled:!ae,value:V?.contractNumber??"",placeholder:"Enter contract number",onChange:j=>{const O=j.target.value.trim().toLowerCase(),ee=k.find(ne=>ne.id&&(ne.contractNumber??"").toLowerCase()===O);w(ne=>({...ne,contractId:ee?.id??"",packageId:""}))}},void 0,!1,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:1525},this)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:1525},this)'
  );
  replaceRegexOnce(
    /g\.jsxDEV\(Ii,\{disabled:!ae\|\|!N\.contractId,value:N\.packageId[\s\S]*?lineNumber:159,columnNumber:2187\},this\)/,
    'g.jsxDEV(di,{disabled:!ae,value:re?.packageCode??"",placeholder:"Enter package code",onChange:j=>{const O=j.target.value.trim().toLowerCase(),ee=R.find(ne=>ne.id&&(ne.packageCode??"").toLowerCase()===O);w(ne=>({...ne,packageId:ee?.id??""}))}},void 0,!1,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:2187},this)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:2187},this)'
  );
}

// Keep free text visible while looking up the related Dataverse record.
replaceOnce(
  'projectName:j.target.value,projectId:ee?.id??"",contractorPartyId:"",contractId:"",packageId:""',
  'projectName:j.target.value,projectId:ee?.id??"",contractorName:"",contractorPartyId:"",contractNumber:"",contractId:"",packageCode:"",packageId:""'
);
replaceOnce('value:_?.organizationName??"",placeholder:"Enter contractor name"', 'value:N.contractorName??_?.organizationName??"",placeholder:"Enter contractor name"');
replaceOnce('w(ne=>({...ne,contractorPartyId:ee?.id??""}))', 'w(ne=>({...ne,contractorName:j.target.value,contractorPartyId:ee?.id??""}))');
replaceOnce('value:V?.contractNumber??"",placeholder:"Enter contract number"', 'value:N.contractNumber??V?.contractNumber??"",placeholder:"Enter contract number"');
replaceOnce('w(ne=>({...ne,contractId:ee?.id??"",packageId:""}))', 'w(ne=>({...ne,contractNumber:j.target.value,contractId:ee?.id??"",packageCode:"",packageId:""}))');
replaceOnce('value:re?.packageCode??"",placeholder:"Enter package code"', 'value:N.packageCode??re?.packageCode??"",placeholder:"Enter package code"');
replaceOnce('w(ne=>({...ne,packageId:ee?.id??""}))', 'w(ne=>({...ne,packageCode:j.target.value,packageId:ee?.id??""}))');

// Resolve typed references from the latest query results, including records that
// arrive after the user has typed or are refreshed while the dialog is open.
replaceOnce(
  'const Ek=()=>',
  fs.readFileSync(path.join(root, 'web/submitter-references.js'), 'utf8').trim() + '\nconst Ek=()=>'
);
replaceOnce(
  '{data:i=[]}=A$e({orderBy:["projectName asc"]}),{data:o=[]}=lte({orderBy:["organizationName asc"]}),{data:l=[]}=V$e({orderBy:["contractNumber asc"]}),{data:c=[]}=P$e({orderBy:["packageCode asc"]})',
  '{data:i=[],refetch:bpRefetchProjects}=A$e({orderBy:["projectName asc"]}),{data:o=[],refetch:bpRefetchParties}=lte({orderBy:["organizationName asc"]}),{data:l=[],refetch:bpRefetchContracts}=V$e({orderBy:["contractNumber asc"]}),{data:c=[],refetch:bpRefetchPackages}=P$e({orderBy:["packageCode asc"]})'
);
replaceOnce(
  'C=D.useRef(null),k=l.filter(j=>j.project.id===N.projectId&&j.activeStatusKey==="Active"),R=c.filter(j=>j.contract.id===N.contractId&&j.activeStatusKey==="Active"),A=o.filter(j=>j.project.id===N.projectId&&j.partyTypeKey==="Contractor"&&j.activeStatusKey==="Active"),_=o.find(j=>j.id===N.contractorPartyId),M=i.find(j=>j.id===N.projectId),V=l.find(j=>j.id===N.contractId),re=c.find(j=>j.id===N.packageId)',
  'C=D.useRef(null),bpRefreshReferences=async()=>{const results=await Promise.allSettled([bpRefetchProjects(),bpRefetchParties(),bpRefetchContracts(),bpRefetchPackages()]);return Object.fromEntries(["projects","parties","contracts","packages"].map((key,index)=>[key,results[index].status==="fulfilled"&&Array.isArray(results[index].value.data)?results[index].value.data:[i,o,l,c][index]]))},bpResolved=bpResolveSubmitterReferences({projects:i,parties:o,contracts:l,packages:c,values:N}),M=bpResolved.project,k=bpResolved.projectContracts,A=bpResolved.projectContractors,_=bpResolved.contractor,V=bpResolved.contract,R=bpResolved.contractPackages,re=bpResolved.package'
);
replaceOnce('B=()=>{x(null),w(Ek()),T([]),m(!0)}', 'B=()=>{void bpRefreshReferences(),x(null),w(Ek()),T([]),m(!0)}');
replaceOnce('oe=j=>{const O=localStorage.getItem(`buildpay-claim-${j.claimReference}`)', 'oe=j=>{void bpRefreshReferences();const O=localStorage.getItem(`buildpay-claim-${j.claimReference}`)');
replaceOnce(
  'N.projectId||O.push("Project is required"),N.contractId||O.push("Contract is required"),N.contractorPartyId||O.push("Project contractor is required"),N.packageId||O.push("Contract package is required")',
  'M||O.push("Choose an existing active project by name or code."),V||O.push("Choose an active contract for this project."),_||O.push("Choose an active contractor for this project."),re||O.push("Choose an active package for this contract.")'
);
replaceOnce('Te=j=>{const O=[];return M||', 'Te=(j,bpCurrent=bpResolved)=>{const{project:M,contract:V,contractor:_,package:re}=bpCurrent,O=[];return M||');
replaceOnce('ue=async j=>{const O=Te(j);if(O.length)', 'ue=async j=>{const bpCurrent=bpResolveSubmitterReferences({...await bpRefreshReferences(),values:N}),{project:M,contract:V,contractor:_,package:re}=bpCurrent,O=Te(j,bpCurrent);if(O.length)');
replaceOnce(
  'placeholder:"Enter project name or code",onChange:j=>',
  'placeholder:"Enter project name or code",onBlur:()=>{void bpRefreshReferences()},onChange:j=>'
);
replaceOnce(
  'lineNumber:159,columnNumber:69},this)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:69},this),g.jsxDEV("div",{className:"space-y-2",children:[g.jsxDEV(nn,{children:"Contractor"',
  'lineNumber:159,columnNumber:69},this),g.jsxDEV("p",{className:"text-xs text-muted-foreground",children:"Enter the name or code of an active project already in Dataverse."},void 0,!1)]},void 0,!0,{fileName:"/workspace/project/apps/submitter-dashboard.tsx",lineNumber:159,columnNumber:69},this),g.jsxDEV("div",{className:"space-y-2",children:[g.jsxDEV(nn,{children:"Contractor"'
);

// Keep the open review dialog in sync after the first stage transition.
replaceOnce(
  'ue==="UnderReview"?M(O=>({...O,reviewStartedAt:j})):S(null)',
  'ue==="UnderReview"?(S(O=>O?{...O,workflowStatusKey:"UnderReview"}:O),M(O=>({...O,reviewStartedAt:j}))):S(null)'
);

// Export dashboards can receive records without a claim date from Dataverse fixtures.
replaceOnce(
  'function U$e(){',
  'function bpSafeFormatDate(value, pattern){const date=new Date(value);return Number.isNaN(date.getTime())?"—":ta(date,pattern)}function U$e(){'
);
replaceOnce('month:ta(new Date(_.claimDate),"MMM")', 'month:bpSafeFormatDate(_.claimDate??_.submittedDate,"MMM")');

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
    const hook = `;${marker}const bpOpened=D.useRef(false);D.useEffect(()=>{if(bpOpened.current)return;${name === 'iH' ? 'if(openCreate){bpOpened.current=true;B();return;}' : ''}const bpRecords=Array.isArray(${allowed})?${allowed}:[];const record=bpRecords.find(item=>item?.id===selectedId);if(record){bpOpened.current=true;${opener}(record)}},[selectedId,openCreate,${data}])`;
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
