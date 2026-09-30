const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ D: {}, Que: {}, r$: {}, yf: {}, e$: {}, Intl, Date, URLSearchParams, setTimeout, clearTimeout, window: { location: { hash: '' } } });
vm.runInContext(fs.readFileSync(path.join(root, 'web/workspace.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/submitter-references.js'), 'utf8'), context);
const record = (id, status, identity = 'person@example.com') => ({ id, workflowStatusKey: status, submitterIdentity: identity });

test('host identity times out and a subsequent attempt can succeed', async () => {
  await assert.rejects(context.bpLoadUser(() => new Promise(() => {}), 10), /did not respond in time/);
  const user = { userPrincipalName: 'person@example.com' };
  assert.equal(await context.bpLoadUser(async () => ({ user }), 100), user);
});
test('missing identity and host errors fail closed', async () => {
  await assert.rejects(context.bpLoadUser(async () => ({}), 100), /did not provide a signed-in account/);
  await assert.rejects(context.bpLoadUser(async () => { throw new Error('Host unavailable'); }, 100), /Host unavailable/);
});
test('each role sees only actionable lifecycle stages in its queue', () => {
  const records = ['Draft', 'Submitted', 'UnderReview', 'Recommended', 'Approved', 'PaidClosed', 'Returned', 'Rejected'].map((status, index) => record(index, status));
  for (const [role, expected] of Object.entries({ submitter: ['Draft', 'Returned'], reviewer: ['Submitted', 'UnderReview'], approver: ['Recommended'], finance: ['Approved'] })) {
    assert.deepEqual(Array.from(context.bpQueue(records, role), item => item.workflowStatusKey), expected);
  }
});
test('submitter ownership is case-insensitive and tolerates absent identities', () => {
  const records = [record(1, 'Draft', 'Person@Example.com'), record(2, 'Draft', 'someone@example.com'), record(3, 'Draft', null)];
  assert.deepEqual(Array.from(context.bpOwned(records, 'submitter', 'person@example.com'), item => item.id), [1]);
  assert.equal(context.bpOwned(records, 'reviewer', '').length, 3);
});
test('draft and closed claims do not show false overdue warnings', () => {
  for (const status of ['Draft', 'PaidClosed', 'Rejected']) assert.equal(context.bpDue({ ...record(1, status), statutoryDueDate: '2020-01-01' }).urgent, false);
  assert.equal(context.bpDue({ ...record(1, 'Submitted'), statutoryDueDate: '2020-01-01' }).urgent, true);
  assert.equal(context.bpDue({ ...record(1, 'Approved'), statutoryDueDate: '2020-01-01', paymentDueDate: '2099-01-01' }).urgent, false);
  assert.equal(context.bpDue({ ...record(1, 'UnderReview'), statutoryDueDate: 'invalid' }).text, 'No due date');
});
test('priority sorting does not mutate records and puts missing dates last', () => {
  const records = [{ id: 1 }, { id: 2, statutoryDueDate: '2026-10-02' }, { id: 3, statutoryDueDate: '2026-09-01' }];
  assert.deepEqual(Array.from(context.bpSort(records), item => item.id), [3, 2, 1]);
  assert.deepEqual(records.map(item => item.id), [1, 2, 3]);
});
test('navigation accepts known destinations and safely defaults unknown hashes', () => {
  context.window.location.hash = '#view=queue&role=finance';
  assert.equal(context.bpReadRoute(['finance']).view, 'queue'); assert.equal(context.bpReadRoute(['finance']).role, 'finance');
  assert.equal(context.bpReadRoute(['submitter']).role, 'submitter');
  context.window.location.hash = '#view=missing&role=constructor';
  assert.equal(context.bpReadRoute(['reviewer']).view, 'overview'); assert.equal(context.bpReadRoute(['reviewer']).role, 'reviewer');
});
test('only explicitly assigned signed-in users receive dashboard roles', () => {
  vm.runInContext("bpRoleAssignments.submitter.push('Person@Example.com'); bpRoleAssignments.reviewer.push('reviewer@example.com')", context);
  assert.deepEqual(Array.from(context.bpAllowedRoles({ userPrincipalName: ' person@example.com ' })), ['submitter']);
  assert.deepEqual(Array.from(context.bpAllowedRoles({ userPrincipalName: 'reviewer@example.com' })), ['reviewer']);
  assert.deepEqual(Array.from(context.bpAllowedRoles({ userPrincipalName: 'someone@example.com' })), []);
  assert.deepEqual(Array.from(context.bpAllowedRoles({})), []);
});

test('typed references resolve after project data arrives and stay within their parent records', () => {
  const values = { projectName: '  New   Project  ', contractorName: 'ACME BUILDERS', contractNumber: 'CON-22', packageCode: 'PKG-1' };
  const data = {
    projects: [{ id: 'project-22', projectName: 'New Project', projectCode: 'NP22', activeStatusKey: 'Active' }],
    parties: [{ id: 'party-22', project: { id: 'project-22' }, organizationName: 'Acme Builders', partyTypeKey: 'Contractor', activeStatusKey: 'Active' }, { id: 'wrong-party', project: { id: 'other-project' }, organizationName: 'Acme Builders', partyTypeKey: 'Contractor', activeStatusKey: 'Active' }],
    contracts: [{ id: 'contract-22', project: { id: 'project-22' }, contractNumber: 'CON-22', activeStatusKey: 'Active' }],
    packages: [{ id: 'package-22', contract: { id: 'contract-22' }, packageCode: 'PKG-1', activeStatusKey: 'Active' }]
  };
  assert.equal(context.bpResolveSubmitterReferences({ ...data, projects: [], values }).project, undefined);
  const resolved = context.bpResolveSubmitterReferences({ ...data, values });
  assert.equal(resolved.project.id, 'project-22');
  assert.equal(resolved.contractor.id, 'party-22');
  assert.equal(resolved.contract.id, 'contract-22');
  assert.equal(resolved.package.id, 'package-22');
  assert.equal(context.bpResolveSubmitterReferences({ ...data, projects: [{ ...data.projects[0], activeStatusKey: 'OnHold' }], values }).project, undefined);
});
test('build is repeatable and both deployment package copies stay identical', () => {
  const assets = 'CanvasApps/cr44f_buildpayenterpriseportal_81f53_CodeAppPackages';
  const read = file => fs.readFileSync(path.join(root, assets, file));
  execFileSync(process.execPath, ['scripts/build.cjs'], { cwd: root });
  const first = read('assets/index-Cum7pg08.js');
  assert.match(first.toString(), /buildpay-documents-\$\{j\.claimReference\}/);
  assert.match(first.toString(), /This file type cannot be previewed in the browser/);
  assert.match(first.toString(), /bpSafeFormatDate/);
  execFileSync(process.execPath, ['scripts/build.cjs'], { cwd: root });
  assert.deepEqual(read('assets/index-Cum7pg08.js'), first);
  for (const file of ['index.html', 'assets/index-Cum7pg08.js', 'assets/index-CN98kS3T.css']) assert.deepEqual(read(file), fs.readFileSync(path.join(root, 'src/GitHubProject2', assets, file)));
});
