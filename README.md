# BuildPay Enterprise Portal

A Power Platform code app for payment submissions, technical review, executive approval, and finance processing.

The refreshed workspace adds a role-specific overview, direct links to actionable records, a searchable application register with status filters and pagination, a workflow guide, and responsive navigation. Browser back/forward navigation retains the selected role and view. The entry screen clearly identifies the existing preview entry behavior.

## Source and packaging

This repository was supplied as an exported solution with a compiled React bundle, not the original React project. The existing Power Platform SDK, Dataverse services, and role forms are preserved.

- `web/workspace.js`: readable React workspace components, navigation, lifecycle helpers, and application register.
- `web/login.js`: preview entry and inactivity handling.
- `web/portal.css`: responsive design and shared component styling.
- `scripts/build.cjs`: injects the readable UI into the existing bundle and applies narrow workflow fixes. It validates its anchors and supports repeated runs.
- `CanvasApps/..._CodeAppPackages`: exported package assets.
- `src/GitHubProject2/CanvasApps/..._CodeAppPackages`: matching assets used by the existing deployment workflow.

Run `npm run build` after editing the readable sources. It updates both package copies without changing asset paths or introducing new runtime dependencies. If a future solution export changes the generated bundle names or component symbols, review the build anchors and adapter mappings before rebuilding.

The original `GitHubProject2.zip` is unchanged. The existing GitHub workflow packs `src/GitHubProject2` into a new solution archive during deployment. No deployment was performed as part of this update.

## Run and verify

Node.js 22 or newer is sufficient; no dependency installation is required.

```powershell
npm.cmd run build
npm.cmd start
```

The local preview runs at `http://127.0.0.1:4173`. Live records require the Power Platform host and its existing connections. The app shows loading/error states instead of substituting sample records.

```powershell
npm.cmd test
```

The automated checks cover queue routing, submitter ownership, due-date handling, route validation, deterministic builds, and matching deployment copies.

For browser checks, start the isolated test fixture host with `npm.cmd run test:fixtures`, start a dedicated headless Edge/Chromium instance with remote debugging on port 9223 and a separate profile, then run `npm.cmd run test:browser`. The fixture host runs on port 4174 and replaces services only in test responses; it never writes to Dataverse. Tests cover all four dialogs, searching, filtering, pagination, mobile navigation, hosted paths/query strings, error recovery, and payment amount handling. Optional screenshots are written to the ignored `.artifacts` directory.

## Workflow changes and limits

- The overview opens the correct record in the existing role dialog. New application opens the actual submission form and is offered in the submitter workspace.
- Switching roles returns to the overview. Viewing a record outside the current action queue opens a read-only summary.
- Approval preserves the original claimed amount, reads the persisted certified amount, and rejects non-finite or excessive accepted values.
- Finance uses the certified/approved value for queue totals, dialog context, and initial disbursement. Non-finite amounts and payments above that value are rejected.
- Hosted paths and query parameters are preserved instead of rewriting the URL to `/`.

Role switching remains a preview feature, not authorization. The existing host controls record access. Existing browser-local approval, review, finance, attachment, and audit storage behavior is retained; this update does not make those records durable or implement real Microsoft authentication. Server-side authorization, transaction guarantees, and a live Dataverse deployment still need validation in the target environment.
