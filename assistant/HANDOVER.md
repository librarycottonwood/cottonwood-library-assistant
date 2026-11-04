# Library handoff

The library owns its ChatGPT Plus, GitHub implementation repository and library Cloudflare account. ChatGPT is **@cottonwoodlibrary**; GitHub is **librarycottonwood**. The separate redesign repository is not the maintained implementation. Nothing library-related is hosted on Jaden's personal Cloudflare account; all previews and the live website use the library account.

## Current entry points

- Chat: questions, writing and connected reports. Analytics remains a read-only connector; Givebutter reports use the existing official plugin.
- Work with Sanity: supported content drafting/corrections. Actual Studio: https://cottonwood-community-library.sanity.studio/ . Content remains in project `2ou0xy2r` / `production`.
- Codex: the existing **cottonwood-library-editor** and maintained repository. Each website request gets a new worktree/branch/PR and a current-content preview URL. Ask “Ready to save?”, then handle conflicts, merge after explicit approval, verify the live website and clean up task-owned work. Details: `WORKFLOW.md`.
- Live website: https://cottonwood-library.pages.dev/ . The cottonwoodcommunitylibrary.com domain is attached to it at the public launch, moved from Tuesday, November 3 to Thursday, November 5, 2026 at the latest.
- Weekly summary: the existing Monday-afternoon cloud task; verify its actual binding and result in setup-status.json.

## Restoration status — October 22

PR33 and PR34–37 were merged before restoration began. Their donation/newsletter integration, simplified recovery page, preview capture and automatic-repair restrictions remain. The rejected website-saving MCP detour is removed from restoration source; it never passed actual library-account preview/save acceptance. This source change does not update the installed plugin, reporting-app label, or active Worker by itself.

The restoration PR must pass local/CI checks and be previewed before approval. Its new trusted-main workflow can first run after merge; its first verified website save, publisher/Analytics deployment, and installed instruction update must be recorded separately. Until then, installed instructions remain the last observed 0.2.11 release and the hosted website remains the approved donation/newsletter release. Do not claim deployment or installation from a ZIP or repository edit.

The original cloud editor completed a coding request and hosted a preview. Safari follow-up submission failed with `Can't find variable: DisposableStack`; its environment Edit failure is a separate issue. A recovery environment also exists, with hosted-preview access not verified. Neither the library's actual computer nor its likely Chrome browser has been tested. Preserve the prepared environments; do not replace them or attribute the original client failure to the rejected MCP connection.

## Connected work to preserve

General donations use **Support Your Local Library**, campaign `655849` / `R62NJU`. Newsletter signup uses **Library Newsletter**, widget `L4EVDm`. Checkout opening, signup and one expressly approved inbox delivery passed; no payment or bulk email was sent. Actual sender/audience details are in `COMMUNICATIONS.md`.

Buffer has the library Facebook channel and an unscheduled test draft. Instagram remains the board's later action. Squarespace registrar access was recovered; DNS, nameservers and forwarding remain unchanged. Keep registration at Squarespace for the documented launch plan; no transfer is implied. See `DOMAIN-LAUNCH.md` and the existing December handoff roadmap.

## Remaining handoff gates

Verify the restored request → follow-up → preview → approval → merge → live-website sequence in the library account and on its actual device. Update/read back the installed plugin and accurate reporting-only app metadata only after the real supported workflow passes. Preserve “Allow read-only tools”; do not grant all tools.

Still open: recovery/restore rehearsal, CMS records and asset backups, backup library administrator, nonprofit decision, newsletter unsubscribe/suppression rehearsal, final public content/accessibility review and the separately approved public-domain launch. No extra email, unsubscribe action, social publication, billing or DNS change is part of workflow restoration.

Canonical volunteer instructions live in `plugins/cottonwood-library/skills/`; `CODEX.md` holds account wording and `START.md` the editing entry point. `setup-status.json` separates installed/deployed state from proposals and historical evidence. `MAINTENANCE.md` retains the bounded repair policy. Never overwrite another task's worktree or merge the older open design PR21 as cleanup.
