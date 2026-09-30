# BuildPay Enterprise Portal

A Power Platform code app for payment submissions, technical review, executive approval, and finance processing.

The workspace adds a role-specific overview, direct links to actionable records, a searchable application register with status filters and pagination, a workflow guide, and responsive navigation. Browser back/forward navigation retains the selected view and only opens a role assigned to the signed-in user.

## Source and packaging

This repository was supplied as an exported solution with a compiled React bundle, not the original React project. The existing Power Platform SDK, Dataverse services, and role forms are preserved.

- `web/workspace.js`: readable React workspace components, navigation, lifecycle helpers, and application register.
- `web/login.js`: workspace entry and inactivity handling.
- `web/portal.css`: responsive design and shared component styling.
- `scripts/build.cjs`: injects the readable UI into the existing bundle and applies narrow workflow fixes. It validates its anchors and supports repeated runs.
- `CanvasApps/..._CodeAppPackages`: exported package assets.
- `src/GitHubProject2/CanvasApps/..._CodeAppPackages`: matching assets used by the existing deployment workflow.

Run `npm run build` after editing the readable sources. It updates both package copies without changing asset paths or introducing new runtime dependencies. If a future solution export changes the generated bundle names or component symbols, review the build anchors and adapter mappings before rebuilding.

## Dashboard access

Assign users in `bpRoleAssignments` near the top of `web/workspace.js`, using their Power Platform user principal names. For example, add a submitter email to `submitter: ['person@example.com']`. Repeat for reviewer, approver, and finance. A user can have more than one role when their duties require it. Run `npm run build` after changing the assignments. An unassigned account sees an access message, and a direct URL hash cannot open another role's dashboard.

The dashboard gate is client-side. Set matching Dataverse table and record permissions for each group in the Power Platform environment before deploying; those permissions control who can read or change records through the underlying data connection. The entry button is not a separate Microsoft sign-in and does not sign the user out of Power Platform.

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

The automated checks cover queue routing, submitter ownership, due-date handling, reference matching after delayed project data, route validation, deterministic builds, and matching deployment copies.

For browser checks, start the isolated test fixture host with `npm.cmd run test:fixtures`, start a dedicated headless Edge/Chromium instance with remote debugging on port 9223 and a separate profile, then run `npm.cmd run test:browser`. The fixture host runs on port 4174 and replaces services only in test responses; it never writes to Dataverse. Tests cover all four dialogs, searching, filtering, pagination, mobile navigation, hosted paths/query strings, error recovery, payment amount handling, reviewer uploads above the Dataverse text limit, and a complete application from project lookup through payment closure. Optional screenshots are written to the ignored `.artifacts` directory.

## Workflow changes and limits

- The overview opens the correct record in the existing role dialog. New application opens the actual submission form and is offered in the submitter workspace.
- Switching roles returns to the overview. Viewing a record outside the current action queue opens a read-only summary.
- Approval preserves the original claimed amount, reads the persisted certified amount, and rejects non-finite or excessive accepted values.
- Finance uses the certified/approved value for queue totals, dialog context, and initial disbursement. Non-finite amounts and payments above that value are rejected.
- Hosted paths and query parameters are preserved instead of rewriting the URL to `/`.
- The submission form resolves typed project, contractor, contract, and package names against the latest active Dataverse records when saving. It refreshes those lists before validation, so a project added after the form opened can be used. Typing a name in the application form does not create a project record.
- Starting technical review updates the open dialog's status so recommendation is available immediately after the transition succeeds.
- The exported ReviewAttachment `File Content` column is limited to 2,000 characters. Reviewer documents that exceed it are stored in browser IndexedDB and labelled **this browser only**. They can be reopened, previewed, and downloaded on that browser; other reviewers cannot access them, and these local documents do not create a Dataverse audit entry. A Dataverse file column or another shared document store is required for durable, shared reviewer uploads.

Existing browser-local approval, review, finance, attachment, and audit storage behavior is retained; this update does not make those records durable. Server-side authorization, transaction guarantees, and a live Dataverse deployment still need validation in the target environment.
