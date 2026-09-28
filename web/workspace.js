/* Readable UI source, injected into the existing Power Platform bundle by scripts/build.cjs.
 * Existing React, data hooks, dialogs and role workspaces are reused; no extra runtime dependencies.
 */
const bpH = (...args) => D.createElement(...args);
const bpRoles = {
  submitter: { label: 'Submitter', queue: 'My applications', action: 'Prepare your next claim', description: 'Complete drafts and respond to returned applications.', statuses: ['Draft', 'Returned'], icon: Que },
  reviewer: { label: 'Reviewer', queue: 'Technical review', action: 'Keep reviews moving', description: 'Check valuations and supporting evidence before recommendation.', statuses: ['Submitted', 'UnderReview'], icon: r$ },
  approver: { label: 'Approver', queue: 'Approval queue', action: 'Make the next decision', description: 'Review certified claims against your delegated authority.', statuses: ['Recommended'], icon: yf },
  finance: { label: 'Finance', queue: 'Payment queue', action: 'Move approved claims to payment', description: 'Verify invoices, process payments, and record disbursements.', statuses: ['Approved'], icon: e$ }
};
const bpStages = [
  ['Draft', 'Draft', 'submitter'], ['Submitted', 'Submitted', 'reviewer'],
  ['UnderReview', 'In review', 'reviewer'], ['Recommended', 'For approval', 'approver'],
  ['Approved', 'For payment', 'finance'], ['PaidClosed', 'Paid & closed', 'finance']
];
const bpStatusLabels = Object.fromEntries([...bpStages.map(([key, label]) => [key, label]), ['Returned', 'Changes requested'], ['Rejected', 'Rejected']]);
function bpMoney(value, compact = false) { return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', notation: compact ? 'compact' : 'standard', minimumFractionDigits: compact ? 1 : 2, maximumFractionDigits: compact ? 1 : 2 }).format(Number(value) || 0); }
function bpDate(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'; }
function bpDue(record) {
  if (['Draft', 'PaidClosed', 'Rejected'].includes(record.workflowStatusKey)) return { text: '—', urgent: false };
  const raw = record.workflowStatusKey === 'Approved' ? record.paymentDueDate : record.statutoryDueDate;
  if (!raw || Number.isNaN(new Date(raw).getTime())) return { text: 'No due date', urgent: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(raw); due.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  return { text: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due in ${days}d`, urgent: days <= 2 };
}
function bpOwned(records, role, email) { return role === 'submitter' ? records.filter(record => (record.submitterIdentity || '').toLowerCase() === email.toLowerCase()) : records; }
function bpQueue(records, role) { return records.filter(record => bpRoles[role].statuses.includes(record.workflowStatusKey)); }
function bpSort(records) { return [...records].sort((a, b) => (Date.parse(a.statutoryDueDate) || Infinity) - (Date.parse(b.statutoryDueDate) || Infinity)); }
function bpIcon(icon, className = '') { return bpH(icon, { size: 19, 'aria-hidden': true, className }); }
function bpButton(text, onClick, icon, className = 'bp-button') { return bpH('button', { type: 'button', className, onClick }, icon && bpIcon(icon), text); }
function bpBadge(status) { return bpH('span', { className: `bp-badge bp-status-${status}` }, bpH('i', { 'aria-hidden': true }), bpStatusLabels[status] || status); }
function bpReadRoute() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return { role: Object.hasOwn(bpRoles, params.get('role')) ? params.get('role') : 'approver', view: ['overview', 'applications', 'queue', 'audit', 'exports', 'guide'].includes(params.get('view')) ? params.get('view') : 'overview' };
}
function A2e({ onSignOut }) {
  const { data: user } = mb();
  const query = fb({ orderBy: ['submittedDate desc'] });
  const [route, setRoute] = D.useState(bpReadRoute);
  const [mobileOpen, setMobileOpen] = D.useState(false);
  const [isMobile, setIsMobile] = D.useState(() => window.matchMedia('(max-width: 680px)').matches);
  const [request, setRequest] = D.useState(null);
  const [detail, setDetail] = D.useState(null);
  const headingRef = D.useRef(null);
  const role = route.role, view = route.view, config = bpRoles[role];
  const name = user?.fullName || 'Workspace user';
  const email = user?.userPrincipalName || (role === 'submitter' ? 'farhan.a@peninsular-eng.com' : '');
  const records = bpOwned(query.data || [], role, email);
  const pending = bpSort(bpQueue(records, role));
  const nav = [['overview', 'Overview', hde], ['queue', config.queue, config.icon], ['applications', 'Application register', lde], ['audit', 'Audit history', aG], ['exports', 'Export center', Xue]];
  const title = nav.find(item => item[0] === view)?.[1] || 'Workflow guide';
  D.useEffect(() => {
    const media = window.matchMedia('(max-width: 680px)');
    const resize = () => { setIsMobile(media.matches); if (!media.matches) setMobileOpen(false); };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  D.useEffect(() => {
    if (!mobileOpen) return;
    const drawer = document.querySelector('.bp-sidebar');
    drawer?.querySelector('a, button')?.focus();
    const escape = event => {
      if (event.key === 'Escape') { setMobileOpen(false); document.querySelector('.bp-menu')?.focus(); }
      if (event.key === 'Tab') {
        const elements = [...drawer.querySelectorAll('a[href], button:not(:disabled)')];
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [mobileOpen]);
  D.useEffect(() => {
    const handle = () => { setRoute(bpReadRoute()); setRequest(null); setDetail(null); setMobileOpen(false); };
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
  D.useEffect(() => { document.title = `${title} · BuildPay`; headingRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [view, role]);
  function navigate(nextView, nextRole = role, nextRequest = null) {
    const next = { view: nextView, role: nextRole };
    window.history.pushState(null, '', `#${new URLSearchParams(next)}`);
    setRoute(next); setRequest(nextRequest); setMobileOpen(false); setDetail(null);
  }
  function openRecord(record) {
    if (role === 'submitter' || config.statuses.includes(record.workflowStatusKey)) navigate('queue', role, { selectedId: record.id, key: Date.now() });
    else setDetail(record);
  }
  const newApplication = () => navigate('queue', 'submitter', { openCreate: true, key: Date.now() });
  const counts = bpStages.map(([key]) => records.filter(record => record.workflowStatusKey === key).length);
  const isReady = !query.isLoading && !query.isError;
  return bpH('div', { className: 'bp-app' },
    bpH('a', { className: 'bp-skip', href: '#bp-main', onClick: event => { event.preventDefault(); headingRef.current?.focus(); } }, 'Skip to content'),
    mobileOpen && bpH('button', { className: 'bp-backdrop', 'aria-label': 'Close navigation', onClick: () => setMobileOpen(false) }),
    bpH('aside', { className: `bp-sidebar ${mobileOpen ? 'is-open' : ''}`, role: mobileOpen ? 'dialog' : undefined, 'aria-modal': mobileOpen ? true : undefined, 'aria-label': mobileOpen ? 'Workspace navigation' : undefined, ref: node => { if (node) node.inert = isMobile && !mobileOpen; } },
      bpH('a', { className: 'bp-brand', href: '#view=overview&role=' + role, onClick: event => { event.preventDefault(); navigate('overview'); } }, bpH('span', { className: 'bp-logo' }, bpIcon(cj)), bpH('span', null, 'BuildPay', bpH('small', null, 'ENTERPRISE WORKSPACE'))),
      bpH('div', { className: 'bp-workspace-label' }, bpH('span', { className: 'bp-org-icon' }, bpIcon(t$)), bpH('span', null, 'Payment operations', bpH('small', null, 'Project finance workspace'))),
      bpH('p', { className: 'bp-nav-label' }, 'WORKSPACE'),
      bpH('nav', { 'aria-label': 'Workspace navigation' }, nav.map(([id, label, icon]) => bpH('button', { key: id, className: `bp-nav-item ${view === id ? 'active' : ''}`, 'aria-current': view === id ? 'page' : undefined, onClick: () => navigate(id) }, bpIcon(icon), bpH('span', null, label), id === 'queue' && isReady && pending.length > 0 && bpH('b', null, pending.length)))),
      bpH('div', { className: 'bp-sidebar-bottom' },
        bpButton('Workflow guide', () => navigate('guide'), Q5, `bp-nav-item ${view === 'guide' ? 'active' : ''}`),
        bpH('div', { className: 'bp-environment' }, bpH('i', null), bpH('div', null, 'Preview workspace', bpH('small', null, 'Role switching enabled'))),
        bpH('div', { className: 'bp-sidebar-user' }, bpH('span', { className: 'bp-avatar' }, name.split(' ').map(part => part[0]).join('').slice(0, 2)), bpH('div', null, name, bpH('small', null, config.label)), bpH('button', { title: 'Leave workspace', 'aria-label': 'Leave workspace', onClick: onSignOut }, bpIcon(hue)))
      )
    ),
    bpH('div', { className: 'bp-body' },
      bpH('header', { className: 'bp-topbar' },
        bpH('div', { className: 'bp-breadcrumb' }, bpH('button', { className: 'bp-menu', 'aria-label': 'Open navigation', 'aria-expanded': mobileOpen, onClick: () => setMobileOpen(!mobileOpen) }, '☰'), bpH('span', null, 'Workspace'), bpH('span', { 'aria-hidden': true }, '/'), bpH('strong', null, title)),
        bpH('div', { className: 'bp-topbar-right' }, bpH('span', { className: 'bp-preview-tag' }, 'PREVIEW'), bpH('label', { className: 'bp-role-picker' }, bpH('span', null, 'Viewing as'), bpH('select', { 'aria-label': 'Workspace role', value: role, onChange: event => navigate('overview', event.target.value) }, Object.entries(bpRoles).map(([value, entry]) => bpH('option', { key: value, value }, entry.label)))))
      ),
      bpH('main', { id: 'bp-main', className: 'bp-main', tabIndex: -1, ref: headingRef },
        view === 'overview' && bpH(D.Fragment, null,
          bpH('section', { className: 'bp-page-heading' }, bpH('div', null, bpH('p', { className: 'bp-eyebrow' }, 'YOUR WORKSPACE, AT A GLANCE'), bpH('h1', null, 'Payment overview'), bpH('p', null, 'A clear view of your claims. A confident next step.')), bpH('div', { className: 'bp-heading-actions' }, bpButton(query.isFetching ? 'Refreshing…' : 'Refresh', () => query.refetch(), vN, 'bp-button bp-secondary'), role === 'submitter' ? bpButton('New application', newApplication, tde) : bpButton('Open ' + config.queue.toLowerCase(), () => navigate('queue'), hue))),
          bpH('section', { className: 'bp-stats', 'aria-label': 'Payment summary' }, [
            ['Applications', records.length, 'Across your visible portfolio', lde, 'neutral'],
            ['Awaiting your action', pending.length, config.queue, yN, 'amber'],
            ['Claimed value', bpMoney(records.reduce((sum, record) => sum + (Number(record.claimedAmountMYR) || 0), 0), true), 'Original submitted amounts', e$, 'teal'],
            ['Paid & closed', records.filter(record => record.workflowStatusKey === 'PaidClosed').length, 'Completed applications', lj, 'green']
          ].map(([label, value, caption, icon, tone]) => bpH('article', { key: label, className: 'bp-stat' }, bpH('div', { className: 'bp-stat-top' }, label, bpH('span', { className: `bp-stat-icon ${tone}` }, bpIcon(icon))), bpH('strong', null, isReady ? value : '—'), bpH('small', null, caption)))),
          bpH('div', { className: 'bp-overview-grid' }, bpH('section', { className: 'bp-panel bp-priority' },
            bpH('div', { className: 'bp-panel-heading' }, bpH('div', null, bpH('p', { className: 'bp-eyebrow' }, 'NEXT UP'), bpH('h2', null, config.action), bpH('p', null, config.description)), bpH('span', { className: 'bp-count' }, isReady ? `${pending.length} pending` : 'Loading')),
            bpH(BpRecords, { records: pending, query, onOpen: openRecord, compact: true, emptyTitle: 'You’re all caught up', emptyText: 'Applications that need your attention will appear here.', onReset: null }),
            bpH('div', { className: 'bp-panel-footer' }, bpH('span', null, 'Ordered by earliest statutory due date'), bpButton('View queue', () => navigate('queue'), hue, 'bp-text-button'))),
            bpH('section', { className: 'bp-panel bp-lifecycle' }, bpH('div', { className: 'bp-panel-heading' }, bpH('div', null, bpH('p', { className: 'bp-eyebrow' }, 'FROM CLAIM TO CLOSE'), bpH('h2', null, 'Payment lifecycle'))), bpH('ol', null, bpStages.map(([key, label, owner], index) => bpH('li', { key }, bpH('span', { className: `bp-step ${config.statuses.includes(key) ? 'current' : ''}` }, index + 1), bpH('div', null, bpH('strong', null, label), bpH('small', null, bpRoles[owner].label)), bpH('b', null, isReady ? counts[index] : '—')))), bpH('div', { className: 'bp-lifecycle-note' }, bpIcon(r$), 'Returned claims go back to the submitter for correction.'))),
          bpH('section', { className: 'bp-note' }, bpH('div', null, bpH('strong', null, 'Every application has a next step.'), bpH('p', null, 'Follow its status, check supporting evidence, and keep decisions traceable.')), bpButton('Explore the workflow', () => navigate('guide'), hue, 'bp-text-button'))
        ),
        view === 'applications' && bpH(BpRegister, { records, query, onOpen: openRecord }),
        view === 'queue' && bpH(D.Fragment, null,
          bpH('div', { className: 'bp-context-strip' }, bpIcon(config.icon), bpH('span', null, bpH('strong', null, config.label + ' workspace'), ' · ' + config.description)),
          query.isError ? bpH(BpDataState, { query }) : bpH('div', { className: 'shell-content bp-legacy' }, bpH(({ submitter: iH, reviewer: E2e, approver: lBe, finance: o2e })[role], { key: `${role}-${request?.key || 'queue'}`, ...request }))),
        view === 'audit' && bpH('div', { className: 'shell-content bp-legacy bp-padded' }, bpH(u2e)),
        view === 'exports' && bpH('div', { className: 'shell-content bp-legacy bp-padded' }, bpH(U$e)),
        view === 'guide' && bpH(BpGuide),
        bpH('footer', { className: 'bp-footer' }, bpH('span', null, 'BuildPay Enterprise'), bpH('span', null, 'Payment operations · MYR'))
      )
    ),
    bpH(ad, { open: !!detail, onOpenChange: open => { if (!open) setDetail(null); } }, bpH(id, { className: 'bp-detail-dialog' }, bpH(od, null, bpH(sd, null, detail?.claimReference || 'Application details'), bpH(ld, null, detail?.projectDetails || 'Application summary')), detail && bpH(D.Fragment, null, bpBadge(detail.workflowStatusKey), bpH('dl', { className: 'bp-detail-grid' }, [['Contractor', detail.contractorOrganization], ['Claimed amount', bpMoney(detail.claimedAmountMYR)], ['Certified / approved amount', detail.certifiedAmountMYR == null ? 'Not certified' : bpMoney(detail.certifiedAmountMYR)], ['Submitted', bpDate(detail.submittedDate)], ['Statutory due date', bpDate(detail.statutoryDueDate)], ['Return reason', detail.latestReturnReason || '—']].map(([label, value]) => bpH('div', { key: label }, bpH('dt', null, label), bpH('dd', null, value)))), bpH('p', { className: 'bp-detail-note' }, 'This application is outside your current action queue. Use the role selector to explore the responsible workspace in preview mode.'), bpButton('Close details', () => setDetail(null)))))
  );
}
function BpDataState({ query }) {
  return bpH('div', { className: 'bp-empty', role: query.isError ? 'alert' : 'status' }, bpIcon(query.isError ? nG : vN), bpH('h3', null, query.isError ? 'Applications could not be loaded' : 'Loading your applications…'), bpH('p', null, query.isError ? 'Check your Power Platform connection and try again.' : 'Getting the latest records for this workspace.'), query.isError && bpButton('Try again', () => query.refetch(), vN, 'bp-button bp-secondary'));
}
function BpRecords({ records, query, onOpen, compact = false, emptyTitle = 'No matching applications', emptyText = 'Try another search or status filter.', onReset }) {
  if (query.isLoading || query.isError) return bpH(BpDataState, { query });
  if (!records.length) return bpH('div', { className: 'bp-empty', role: 'status' }, bpIcon(lj), bpH('h3', null, emptyTitle), bpH('p', null, emptyText), onReset && bpButton('Clear filters', onReset, null, 'bp-button bp-secondary'));
  return bpH('div', { className: 'bp-table-scroll', tabIndex: 0, role: 'region', 'aria-label': 'Applications table' }, bpH('table', { className: 'bp-table' },
    bpH('thead', null, bpH('tr', null, ['Application / project', 'Status', 'Claimed amount', 'Due', ''].map((label, index) => bpH('th', { key: index, scope: 'col', className: index === 2 ? 'bp-numeric' : '' }, label || bpH('span', { className: 'bp-sr-only' }, 'Action'))))),
    bpH('tbody', null, (compact ? records.slice(0, 5) : records).map(record => { const due = bpDue(record); return bpH('tr', { key: record.id },
      bpH('td', null, bpH('button', { className: 'bp-record-link', onClick: () => onOpen(record) }, record.claimReference), bpH('small', { className: 'bp-project' }, record.projectDetails)),
      bpH('td', null, bpBadge(record.workflowStatusKey)), bpH('td', { className: 'bp-numeric' }, bpMoney(record.claimedAmountMYR)), bpH('td', { className: due.urgent ? 'bp-urgent' : 'bp-due' }, due.text),
      bpH('td', null, bpH('button', { className: 'bp-row-action', 'aria-label': `Open ${record.claimReference}`, onClick: () => onOpen(record) }, bpIcon(hue)))
    ); }))));
}
function BpRegister({ records, query, onOpen }) {
  const [search, setSearch] = D.useState(''); const [status, setStatus] = D.useState('all'); const [page, setPage] = D.useState(0);
  const filtered = records.filter(record => (status === 'all' || record.workflowStatusKey === status) && [record.claimReference, record.projectDetails, record.contractorOrganization].some(value => String(value || '').toLowerCase().includes(search.trim().toLowerCase())));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 10) - 1));
  function reset() { setSearch(''); setStatus('all'); setPage(0); }
  return bpH(D.Fragment, null, bpH('section', { className: 'bp-page-heading' }, bpH('div', null, bpH('p', { className: 'bp-eyebrow' }, 'ALL IN ONE PLACE'), bpH('h1', null, 'Application register'), bpH('p', null, 'Track claims, find a record, and see what happens next.')), bpButton('Refresh', () => query.refetch(), vN, 'bp-button bp-secondary')),
    bpH('section', { className: 'bp-panel' }, bpH('div', { className: 'bp-filters' }, bpH('label', { className: 'bp-search' }, bpIcon(bN), bpH('input', { 'aria-label': 'Search applications', placeholder: 'Search reference, project, or contractor…', value: search, onChange: event => { setSearch(event.target.value); setPage(0); } })), bpH('select', { 'aria-label': 'Filter by status', value: status, onChange: event => { setStatus(event.target.value); setPage(0); } }, bpH('option', { value: 'all' }, 'All statuses'), Object.entries(bpStatusLabels).map(([key, value]) => bpH('option', { key, value: key }, value))), (search || status !== 'all') && bpButton('Clear', reset, null, 'bp-text-button')),
      bpH(BpRecords, { records: filtered.slice(currentPage * 10, currentPage * 10 + 10), query, onOpen, onReset: search || status !== 'all' ? reset : null, emptyTitle: records.length ? undefined : 'No applications yet', emptyText: records.length ? undefined : 'Applications will appear here when they are available to this workspace.' }),
      bpH('div', { className: 'bp-panel-footer' }, bpH('span', { role: 'status' }, query.isLoading || query.isError ? '—' : `${filtered.length ? currentPage * 10 + 1 : 0}–${Math.min((currentPage + 1) * 10, filtered.length)} of ${filtered.length} applications`), bpH('div', { className: 'bp-pagination' }, bpH('button', { className: 'bp-button bp-secondary', disabled: currentPage === 0, onClick: () => setPage(currentPage - 1) }, 'Previous'), bpH('button', { className: 'bp-button bp-secondary', disabled: (currentPage + 1) * 10 >= filtered.length, onClick: () => setPage(currentPage + 1) }, 'Next')))));
}
function BpGuide() {
  const steps = [
    ['Prepare the claim', 'Submitter', 'Select the project, contractor, contract, and package. Complete valuation lines and attach supporting documents. Save a draft or submit for review.'],
    ['Review and certify', 'Reviewer', 'Check quantities and evidence. Request changes with a clear reason, or attach the required review documents and recommend a certified amount.'],
    ['Record the decision', 'Approver', 'Review the certified amount and delegated authority. Approve within the limit, request corrections, reject with a reason, or escalate above the limit.'],
    ['Verify and pay', 'Finance', 'Verify the invoice and beneficiary, move the payment to processing, and record the bank reference before closing the application.']
  ];
  return bpH(D.Fragment, null, bpH('section', { className: 'bp-page-heading' }, bpH('div', null, bpH('p', { className: 'bp-eyebrow' }, 'A SHARED WAY OF WORKING'), bpH('h1', null, 'From application to payment'), bpH('p', null, 'Four workspaces. One clear handoff at every stage.'))), bpH('div', { className: 'bp-guide-grid' }, steps.map(([title, owner, description], index) => bpH('article', { className: 'bp-panel bp-guide-card', key: title }, bpH('span', { className: 'bp-guide-number' }, `0${index + 1}`), bpH('p', { className: 'bp-eyebrow' }, owner), bpH('h2', null, title), bpH('p', null, description)))), bpH('div', { className: 'bp-note' }, bpH('div', null, bpH('strong', null, 'Corrections keep the same application reference'), bpH('p', null, 'Returned applications go back to the submitter. Update the claim, respond to the query, and resubmit for technical review.'))), bpH('p', { className: 'bp-preview-explanation' }, 'The role selector is a preview control, not an authorization boundary. Access to connected records is governed by your Power Platform environment.'));
}
