# Weekly library website upkeep

The website checker runs on library-owned GitHub infrastructure daily at
16:37 UTC (08:37 PST / 09:37 PDT), and after source changes. It does not use the
library's ChatGPT allowance. It runs the existing build, release-integrity,
privacy-consent, and desktop/phone checks. It does not test public uptime,
publish the library domain, or automatically update dependencies merely because newer versions exist.

Each main-branch run writes its result to the `maintenance-reports` branch at
`.library-checks/<source commit SHA>.json`. Reports identify the exact checked
source, outcome, time, and workflow run. The report branch is excluded from
push-triggered checks to avoid generating another run for each report.

The assistant's separate weekly task should run after the checker, around 2 PM
Pacific on Monday. Scheduled web tasks were tested: they have generic cloud
execution and GitHub access, but do not inherit `cottonwood-library-editor`.
They must use GitHub tools and the repository's cloud checks for upkeep, with
their identity and scope explicitly included in the saved task prompt.

## Saved task prompt

You are Cottonwood Library Assistant, the warm, concise helper for Cottonwood
Community Library. Perform weekly upkeep of the private repository
librarycottonwood/cottonwood-library-assistant using connected GitHub tools and
its cloud checks. Handle technical investigation yourself. Do not ask volunteers
technical questions or send implementation plans. This scheduled task does not
inherit the interactive website editor; do not claim that it does.

Read the repository's current AGENTS.md and assistant/MAINTENANCE.md. Find the current main
commit, then read .library-checks/<that exact SHA>.json from maintenance-reports.
Use its actual result and run URL; do not treat a report for older source as a
check of current source. If it is missing, inspect available workflow evidence
or wait briefly for an in-progress check. If verification is unavailable, report
that plainly and make no changes based on an assumed pass.

Review failed checks and relevant security advisories for the pinned dependencies.
Research only when a finding warrants it. Do not upgrade packages merely because
newer releases exist. Keep this focused: at most one necessary, small maintenance
fix per run, and no repeated retries or broad rebuilds without a concrete reason.

The failure-triggered GitHub worker owns repair attempts. Read its recent runs
and open issues titled Website check needs attention. Do not start a competing
repair while that worker is active, and do not repeatedly retry a version already
attempted. Investigate technical findings yourself. A completed verified repair
or unresolved meaningful failure warrants a short friendly update once; routine
successful check reports do not.

For a relevant security update outside a reported check failure, prepare at most
one necessary small update with GitHub tools. Require successful cloud checks for
the exact changed version before saving, preserve concurrent work, and keep public
wording, hours, events, design, donation settings, accounts, billing and domains
subject to the appropriate human decision. If the required verification tools
are unavailable, stop the update and explain the practical limitation briefly.
Never hand volunteers an implementation plan or ask them technical questions.

No live-domain publishing is connected. Saving maintenance source is not public
publication, and does not regenerate an already-hosted immutable preview.

Stay quiet when there is no new actionable finding. Notify only for a completed
necessary repair, a meaningful failure, or required human action. Use one or two
friendly sentences explaining the practical effect, not test counts, repositories,
commands, or implementation plans. Keep detailed evidence in the maintenance
work, available if the administrator asks. Do not send email or Facebook posts.

## Validation on October 6, 2026

The library-account scheduled cloud task read current main commit
`4799a60bca8f904a583cfd22ad4c9e5bcb6093d1` and its actual successful report
from `maintenance-reports`, linking workflow run `37559880206`. The temporary
read-only validation override was removed before enabling recurrence. Native
schedule readback confirmed cloud execution, enabled status, Monday afternoon
(14:00 America/Los_Angeles), with the first run October 12.

The baseline proves scheduled repository/report access and cloud checks. The
failure-triggered worker has separately passed a complete isolated repair rehearsal.
The prompt requires successful exact-version checks before saving a repair;
if those tools are unavailable, it must stop the repair rather than assume a pass.
Quiet healthy operation is requested in the prompt; notification suppression
has not been demonstrated. No daily agent task is enabled.

## Failure-triggered worker within Plus

The private library repository now has `.github/workflows/upkeep.yml`.
A failed Verify library website run on current main triggers the worker.
GitHub supplies the temporary cloud computer. Codex signs in as
librarycottonwood@gmail.com and uses the library's Plus allowance, with
`gpt-6-luna`, whose actual availability was verified. This is the documented
managed-account authentication route for trusted private automation:
https://learn.chatgpt.com/docs/auth/ci-cd-auth
No OpenAI API key or separate API billing is configured.

The agent runs inside a disposable Docker container with connected apps disabled.
It receives the source and library instructions, but no GitHub write token or
credential encryption key. A trusted helper restricts patches to existing
components, layouts, styles, and pinned dependency updates. It rejects changes
to public content, workflows, tests, package scripts, symlinks, deletions, or
large patches. The agent gets one bounded attempt per source version, with a
six-minute execution limit; attempt records are retained for 90 days.

The library sign-in is stored in repository secret LIBRARY_CODEX_AUTH_SEED.
LIBRARY_AUTH_VAULT_KEY encrypts refreshed sign-in state using AES-GCM before
private artifact storage. Plaintext credentials never enter source or artifacts.
Runs are serialized so refresh state is not shared concurrently. The worker
restores the latest encrypted state, lets Codex refresh normally, and stores
updated encrypted state. A Thursday 18:17 UTC single-word run maintains idle
sessions; it uses a small amount of Plus allowance. Account revocation or failed
refresh can still require a fresh human sign-in. Local bootstrap credentials
were removed after the cloud sign-in test succeeded.

The trusted verification process runs without the ChatGPT credential. A repair
must pass the existing complete checks before creating its repair PR, then pass
the cloud checks on the exact committed version. Saving uses a non-forced update
and requires that main still equals the version the worker repaired. Concurrent
changes therefore block automatic saving. Repairs do not trigger another repair
loop if their own later check fails. Unresolved main failures create an issue
assigned to librarycottonwood, with a plain-language message and a run link for
the assistant. GitHub notification delivery depends on the library account's
notification settings; email delivery has not been tested.

Healthy daily checks use GitHub runner/storage allowance only. Failed-source
repair attempts, the weekly assistant review, and the small weekly sign-in run
use Plus. Daily check artifacts retain seven days; encrypted auth and attempt
records retain 90 days. Existing preview links remain immutable; source repairs
do not launch the public library domain or replace earlier hosted previews.

Validation: GitHub-hosted managed sign-in run 37565472835 passed. The repair
rehearsal deliberately broke one image-component import on isolated branch
codex/upkeep-test-20261006. Run 37566234371 fixed the import and passed full build, privacy, release and
36 desktop/phone checks. Run 37566797654 reused that verified patch, passed
exact-version cloud checks, and automatically saved it to the isolated test
branch through PR 2. The main website component remained unchanged.

Evidence: https://github.com/librarycottonwood/cottonwood-library-assistant/actions/runs/37566797654

## Repair update notification

Library-account cloud event task Website repair updates is enabled, ID
6ac5beb375d88191a71e366504a60408. Its accepted trigger watches merged PRs titled
Library website upkeep in this repository; comments/reviews/commit triggers are
disabled. The read-only prompt requires exact repair evidence and a brief warm
response, and never claims existing previews or the public domain were updated.

A real GitHub Actions bot created and merged isolated notification-only PR 3
in run 37567788142. No ChatGPT automation run was recorded in the first readback;
end-to-end event delivery is unverified, and must not be described as working.
The weekly cloud task remains the verified report-access path; unresolved main
failures are also recorded as library-assigned GitHub issues. GitHub email and
quiet healthy-run suppression remain untested. The temporary notification test
workflow was removed after the rehearsal.
