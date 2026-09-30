// Injected only by the localhost preview server; excluded from deployed assets.
const bpDemoUsers = {
  submitter: { fullName: 'Demo Submitter', userPrincipalName: 'farhan.a@peninsular-eng.com' },
  reviewer: { fullName: 'Demo Reviewer', userPrincipalName: 'reviewer@example.com' },
  approver: { fullName: 'Demo Approver', userPrincipalName: 'approver@example.com' },
  finance: { fullName: 'Demo Finance', userPrincipalName: 'finance@example.com' }
};
const allDemoEmails = Object.values(bpDemoUsers).map(u => u.userPrincipalName).concat(['fixture@example.com', 'farhan.a@peninsular-eng.com']);
for (const role of Object.keys(bpRoleAssignments)) bpRoleAssignments[role] = allDemoEmails;
let bpDemoUser = bpDemoUsers.submitter;
gce = async () => ({ user: bpDemoUser });
// Keep this preview entirely local, including operations not covered by fixtures.
ZH = async () => {};
vt = () => new Proxy({}, { get: () => async () => { throw new Error('This operation is unavailable in the local demo.'); } });

