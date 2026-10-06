# Cottonwood Library Assistant

Private conversational website-maintenance demo, isolated from the Squarespace migration.

The agent instructions are in AGENTS.md. Cloud setup and preview operation are documented in assistant/WORKFLOW.md. The setup script installs the pinned dependencies, checks the site, and builds it. A saved release contains a hash-verified asset snapshot; screenshots are captured from that snapshot.

Production publishing is not connected. The preview project has no library domain and must be provisioned with `production` as its production branch. A separate human-controlled approval and publishing service is required before launch.

Development: Node 24, pnpm 11.15.1. Run `bash scripts/cloud-setup.sh`, then `pnpm assistant:prepare` and `pnpm assistant:capture -- <digest>`.

Transfer this private repository into a library-owned GitHub organization when its human owners are ready. Do not transfer a personal account or share an AI login.
