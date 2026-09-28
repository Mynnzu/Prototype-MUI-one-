// Test-only service adapter. Never bundled into either Power Platform package.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../CanvasApps/cr44f_buildpayenterpriseportal_81f53_CodeAppPackages');
const base = { contractorOrganization: 'Peninsular Engineering', projectDetails: 'Meridian Business Park', submitterIdentity: 'farhan.a@peninsular-eng.com', claimedAmountMYR: 125000, certifiedAmountMYR: 110000, submittedDate: '2026-09-20T00:00:00Z', statutoryDueDate: '2026-10-10T00:00:00Z', paymentDueDate: '2026-10-15T00:00:00Z', reviewerDueDate: '2026-10-08T00:00:00Z', project: { id: 'project-1', projectCode: 'MER' }, contract: { id: 'contract-1', contractNumber: 'CON-001' }, contractPackage: { id: 'package-1', packageCode: 'PKG-001' }, entryCategoryKey: 'ProgressClaim', contractPackageDetails: 'PKG-001 Structural works', currentMilestoneKey: 'Submitted', daysRemaining: 12 };
const records = ['Recommended', 'Recommended', 'Submitted', 'UnderReview', 'Approved', 'PaidClosed', 'Draft', 'Returned', 'Rejected', 'Recommended', 'Submitted', 'Approved'].map((status, index) => ({ ...base, id: `application-${index + 1}`, claimReference: `PA-2026-${String(index + 1).padStart(3, '0')}`, workflowStatusKey: status, projectDetails: index % 2 ? 'Northbank Residences' : base.projectDetails, latestReturnReason: status === 'Returned' ? 'Please revise the quantities.' : undefined }));
const adapter = `
const bpTestRecords=${JSON.stringify(records)};
window.__bpTest={records:bpTestRecords,updates:[],fail:false,queryClient:XH};
hM.getAll=async()=>{if(window.__bpTest.fail)throw new Error('Test connection failure');return [...bpTestRecords]};
hM.update=async(id,changedFields)=>{window.__bpTest.updates.push({id,changedFields});const record=bpTestRecords.find(item=>item.id===id);Object.assign(record,changedFields);return record};
hM.create=async(fields)=>{const record={...fields,id:crypto.randomUUID()};bpTestRecords.push(record);return record};
D$e.getAll=async()=>[{id:'project-1',projectCode:'MER',projectName:'Meridian Business Park',activeStatusKey:'Active'}];
j$e.getAll=async()=>[{id:'party-1',project:{id:'project-1'},organizationName:'Peninsular Engineering',partyTypeKey:'Contractor',activeStatusKey:'Active'}];
M$e.getAll=async()=>[{id:'contract-1',project:{id:'project-1'},contractNumber:'CON-001',activeStatusKey:'Active'}];
k$e.getAll=async()=>[{id:'package-1',contract:{id:'contract-1'},packageCode:'PKG-001',packageName:'Structural works',activeStatusKey:'Active'}];
for(const service of [ate,ote,y$e,g$e,L$e])service.getAll=async()=>[];
`;
http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname.replace(/^\/hosted\/app\//, '/');
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, raw) => {
    if (error) { response.writeHead(404).end(); return; }
    const ext = path.extname(file);
    const data = ext === '.js' ? raw.toString().replace('qie.createRoot(document.getElementById("root"))', adapter + 'qie.createRoot(document.getElementById("root"))') : raw;
    response.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' })[ext] || 'application/octet-stream' }); response.end(data);
  });
}).listen(4174, '127.0.0.1', () => console.log('Test fixture host: http://127.0.0.1:4174'));
