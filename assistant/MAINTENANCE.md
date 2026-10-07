# Weekly library website upkeep

The website checker runs on library-owned GitHub infrastructure every Monday at
16:37 UTC (08:37 PST / 09:37 PDT), and after source changes. It does not use the
library's ChatGPT allowance. It runs the existing build, release-integrity,
privacy-consent, and desktop/phone checks. It does not test public uptime,
publish the library domain, or automatically update dependencies.

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

For a necessary technical repair, use a separate branch and pull request. Read
the current source and preserve concurrent work. The pull request triggers the
existing GitHub cloud checks. Use GitHub workflow-run tools to verify successful
checks for the exact pull-request head, and inspect relevant logs. Never merge
unverified changes. Before merging, check that the head has not changed. Routine
repairs that preserve visitor-facing content and behavior may be saved after
those checks pass. Public wording, hours, events, donation settings, design,
account permissions, credentials, billing, and domain changes require the
appropriate human decision; do not make them as routine maintenance.

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

The baseline proves scheduled repository/report access and cloud checks. An
automatic repair, pull-request verification, and merge have not been rehearsed.
The prompt requires successful exact-version checks before saving a repair;
if those tools are unavailable, it must stop the repair rather than assume a pass.
Quiet healthy operation is requested in the prompt; notification suppression
has not been demonstrated. No daily agent task is enabled.
