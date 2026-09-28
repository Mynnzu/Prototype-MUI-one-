function O2e() {
  const [entered, setEntered] = D.useState(false);
  const [remaining, setRemaining] = D.useState(null);
  const activity = D.useRef(Date.now());
  D.useEffect(() => {
    if (!entered) return;
    activity.current = Date.now();
    const touch = () => { if (Date.now() - activity.current < 14 * 60000) activity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, touch, { passive: true, capture: true }));
    const timer = window.setInterval(() => {
      const seconds = Math.ceil((15 * 60000 - (Date.now() - activity.current)) / 1000);
      if (seconds <= 0) { setEntered(false); setRemaining(null); Ot.info('Your preview session ended after 15 minutes of inactivity.'); }
      else setRemaining(seconds <= 60 ? seconds : null);
    }, 1000);
    return () => { clearInterval(timer); events.forEach(event => window.removeEventListener(event, touch, true)); };
  }, [entered]);
  const leave = () => { setEntered(false); setRemaining(null); };
  if (entered) return bpH(D.Fragment, null, bpH(A2e, { onSignOut: leave }), bpH(ad, { open: remaining !== null }, bpH(id, { onEscapeKeyDown: event => event.preventDefault(), onPointerDownOutside: event => event.preventDefault() }, bpH(od, null, bpH(sd, null, 'Still working?'), bpH(ld, null, 'Your preview session will end after 15 minutes without activity. Save any changes before leaving.')), bpH('p', { role: 'timer', className: 'bp-session-timer' }, `${remaining} seconds remaining`), bpH(wf, null, bpButton('Leave workspace', leave, null, 'bp-button bp-secondary'), bpButton('Keep working', () => { activity.current = Date.now(); setRemaining(null); })))));
  return bpH('main', { className: 'bp-login' },
    bpH('section', { className: 'bp-login-story' },
      bpH('div', { className: 'bp-brand' }, bpH('span', { className: 'bp-logo' }, bpIcon(cj)), bpH('span', null, 'BuildPay', bpH('small', null, 'ENTERPRISE WORKSPACE'))),
      bpH('div', { className: 'bp-login-message' }, bpH('p', { className: 'bp-eyebrow' }, 'CLARITY AT EVERY STAGE'), bpH('h1', null, 'Good projects deserve', bpH('br'), bpH('em', null, 'a smoother payment flow.')), bpH('p', { className: 'bp-login-description' }, 'Bring claims, reviews, approvals, and payments together. Give every decision a clear next step.'),
        bpH('div', { className: 'bp-login-flow', 'aria-label': 'Payment workflow' }, [[Que, 'Submit'], [r$, 'Review'], [yf, 'Approve'], [e$, 'Pay']].map(([icon, label], index) => bpH('div', { key: label }, bpH('span', null, bpIcon(icon)), bpH('small', null, `0${index + 1}`), bpH('strong', null, label))))),
      bpH('div', { className: 'bp-login-footer' }, bpIcon(t$), 'Built for project teams. Connected by one workflow.')
    ),
    bpH('section', { className: 'bp-login-entry' }, bpH('div', { className: 'bp-login-card' },
      bpH('span', { className: 'bp-login-kicker' }, 'BUILDPAY ENTERPRISE'), bpH('h2', null, 'Your workspace awaits.'), bpH('p', { className: 'bp-login-intro' }, 'Explore a clearer way to manage project payments, from the first claim to the final release.'),
      bpH('div', { className: 'bp-entry-preview' }, bpH('span', { className: 'bp-preview-tag' }, 'PREVIEW'), bpH('div', null, bpH('strong', null, 'Explore every role'), bpH('p', null, 'Switch between submitter, reviewer, approver, and finance workspaces.'))),
      bpButton('Enter workspace', () => setEntered(true), hue),
      bpH('p', { className: 'bp-login-disclosure' }, 'This entry screen is a preview, not Microsoft sign-in. No credentials are requested. Connected data uses the existing Power Platform host access.'),
      bpH('div', { className: 'bp-login-feature' }, bpIcon(lj), 'Clear handoffs', bpH('span', null, '·'), 'Traceable decisions')
    ), bpH('p', { className: 'bp-login-copyright' }, 'BuildPay · Project payment operations'))
  );
}
