# Cottonwood Library Assistant

Private conversational website-maintenance demo, isolated from the Squarespace migration.

The agent instructions are in AGENTS.md. Cloud setup and preview operation are documented in assistant/WORKFLOW.md. The setup script installs the pinned dependencies, checks the site, and builds it. A saved release contains a hash-verified asset snapshot; screenshots are captured from that snapshot.

Sanity content management is implemented but unconnected. Read [CMS setup and handoff](assistant/CMS.md), [Studio forms](studio/README.md) and [checked publishing](cms-publisher/README.md). Google sign-in, project creation and the nonprofit application wait for the library meeting. The default remains the local prototype; no account, paid service or live deployment is created by installing/building this repository. Run `bash scripts/cms-check.sh` for the account-free CMS checks.

Production publishing is not connected. The preview project has no library domain and must be provisioned with `production` as its production branch. A separate human-controlled approval and publishing service is required before launch.

Development: Node 24, pnpm 11.15.1. Run `bash scripts/cloud-setup.sh`, then `pnpm assistant:prepare` and `pnpm assistant:capture -- <digest>`.

The private repository belongs to `librarycottonwood`. Keep account recovery and final launch authority with the library.
