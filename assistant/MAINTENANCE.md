# Library maintenance

## One workflow for each job

- `check.yml`: website build, privacy/release checks and desktop/phone page checks daily at 16:37 UTC, on main saves, and on pull requests. Main results are recorded in `maintenance-reports/.library-checks/<SHA>.json`. Feature pushes do not run a second copy of the pull-request check.
- `upkeep.yml`: one bounded Plus Codex repair attempt when the exact current-main website check fails. It also maintains the stored managed sign-in weekly. It does not use OpenAI API credits. The trusted worker validates an allowlisted patch, preserves concurrent saves, verifies the committed source and updates the trial through the publisher. Credential/permission failures require guided recovery rather than a code repair.
- `trial.yml`: publish the exact checked current-main release and pictures to https://trial.cottonwood-library-trial-preview.pages.dev/ . Skip superseded/already-current versions. Draft links remain immutable; the public domain is separate.
- `analytics.yml`: read-only hosted Analytics connection check daily at 16:47 UTC. Record safe status/next human step in `.library-analytics-checks/`, and maintain one open issue for unresolved access. It stores no visitor counts or secrets. This check does not itself spawn a repair agent for a remote connection failure. Source/protocol failures are covered by `check.yml` and its repair worker.
- `analytics-deploy.yml`: publish checked connector code only when its current live reader is usable. Missing Google approval records account_setup_pending and leaves the existing deployment alone. After publishing, wait for bounded exact-source propagation, verify a real report, and roll back a failed update. Outcomes are in `.library-analytics-deployments/`.
- ChatGPT: **one weekly cloud review**, Monday afternoon at 14:00 Pacific. `assistant/tasks/weekly-maintenance.md` is its canonical saved prompt; the other scheduled task prompts live beside it (see `assistant/tasks/README.md`). Its runs post into the ChatGPT **Maintenance** project, whose instructions are kept in `assistant/projects/maintenance.md`. It reviews actual repairs, current checks and account steps, then gives a friendly short summary. A healthy weekly message is welcome. Immediate repair-event notifications are not part of the required workflow.

The weekly task uses connected GitHub tools in the cloud, not the interactive editor. Keep its binding/state and tested results in setup-status.json. A deleted originating chat can orphan its schedule; replace the broken task and test the replacement instead of keeping a duplicate.

## Repair and credential boundaries

The repair container receives the website/connector source and Plus authentication, never GitHub write authority, Cloudflare publishing tokens or the credential-encryption key. Trusted host helpers reject workflow/test/security changes, public content changes, deletions, broad patches and symlinks. One bounded attempt per source avoids loops. Unresolved failures create library-assigned issues. Account access/recovery remains with the library.

Secrets live in GitHub/Cloudflare settings. Encrypted refreshed Plus state is stored in private artifacts; plaintext keys and logins never belong in source or artifact reports. Google short-lived access renews from an encrypted browser grant. Restored access requires a successful read-only report; signing in alone is not proof.

Healthy website checks consume GitHub allowance, while repairs and the weekly review consume shared Plus allowance. GitHub allowance is finite: the configured $0 overage stop and screenshot-retention cap remain necessary. Avoid duplicate check runs and unneeded agent retries. No paid API, cloud billing or email/social sending is enabled.

## Validation boundaries

The earlier isolated website repair/check/save/trial-publish rehearsal passed. The connector's expiry/revocation/permission scenarios and real-browser redirect are tested with fixtures; hosted reconnect and protected endpoints were verified. The complete live Google grant → ChatGPT report → scheduled report → real connector failure/repair/rollback chain remains pending approval/installation. Do not describe these fixtures as a successful live integration.

`assistant/ANALYTICS-CONNECTOR.md` retains connector-specific evidence. Current account status is in setup-status.json; older rehearsal narratives are retained in Git history.
