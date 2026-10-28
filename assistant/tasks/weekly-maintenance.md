# Weekly library maintenance review

Check whether the library's website and connected reports are working, identify meaningful repairs or failures since the previous review, and tell the board what needs their attention. Use the Cottonwood Library plugin for conversation and relevant report guidance. Give a short, friendly summary in everyday words.

## Read current evidence

Read current main AGENTS.md, assistant/MAINTENANCE.md and assistant/CONTEXT.md in librarycottonwood/cottonwood-library-assistant. Use the current website and account information there; check dated setup evidence before treating an unfinished connection as a new fault.

Through the connected GitHub tools, inspect maintenance-reports:
- .library-checks/<current-main-SHA>.json for source checks.
- .library-cms-checks/latest.json and its sourceChecksResult and cmsLiveResult separately.
- .library-analytics-checks/latest.json and .library-analytics-deployments/latest.json for the report connection.
- Upkeep PRs merged in the past seven days, open incidents and the existing repair worker's actual outcomes.

Check freshness and source versions. Wait briefly if the relevant check is running. Missing, skipped or stale results do not establish a pass. Fixture tests and configuration health do not establish live provider access.

Open the current website and its /_review/status.json. For a recent publishing request or failure, compare its cms.yml operation and publish reports with the hosted operation ID, source, content and release fingerprints. Use authenticated publisher status only through an actually available read connection. Say an update is visible only after deployed_verified matches the hosted result. Do not replace unavailable evidence with an older success, expose credentials or show private CMS content.

A newer source commit awaiting approval does not make the approved website unhealthy. Report drafts, pending previews, verified updates and failures accurately; do not imply every new source commit should already be live.

## Unfinished and stuck saves

Check these through the GitHub and Sanity tools and name each one in plain words (what the change was, not ids):

- Open save PRs (branch `content/…`) older than 24 hours: a change waiting for a yes. Say what it is and that it is not on the website yet.
- PRs merged in the last 7 days whose merge commit has no **Live website** success: merged but not live. Say so and point to the publishing skill's "If it doesn't go live".
- Sanity records published since the last live save with no open save PR (compare with the live site's `/_content/revisions.json`): they will go live with the next person's save. Say what they are.
- A `Sanity content:` failure in a recent `main` check or **Live website** status: name the record and the value that needs fixing.

These problems can sit for days between weekly reviews. Add one line to the report saying this check really wants a daily run, until a daily task is set up.

## Handle problems

The existing GitHub worker owns automatic repairs. Check what it is doing before recommending another attempt. Follow assistant/MAINTENANCE.md for its exact boundaries; do not repair content, account access, authentication, tests or deployment rules to make a check pass. Do not publish from this review or change permissions, billing, domains or library facts. Account failures, exhausted allowances and work outside the worker's scope need the appropriate human step or reviewed technical work. Do not enable paid services or an automatic retry loop.

For a failed update, establish whether the existing website is reachable and whether restoration actually succeeded. Describe verified recovery only; an old saved record is not evidence the website was restored. Never bypass an approval denial or claim an alert was delivered merely because an issue exists.

## Include fundraising when available

Identify the active fundraiser from the actual current provider using assistant/CMS.md and assistant/content/fundraisers.md. Do not substitute seed data for an unavailable CMS read. Use the connected Givebutter tools for its current amount and goal. Include one short line when verified; otherwise say it could not be checked. This is report-only: do not edit the website or take down an expired fundraiser without approval.

## Reply to the board

Say whether the website is working. Mention meaningful new repairs, unresolved problems or a pending decision; avoid repeating old updates. When their help is needed, explain what happened and give one clear next step with a link. Keep commands, vendors, test counts and implementation plans out unless asked. Never report missing data as zero or say something is fixed without checking. Do not send emails or social posts.
