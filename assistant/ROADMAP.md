# Cottonwood Library: open items

The website launched on November 5, 2026 (https://www.cottonwoodcommunitylibrary.com). Content saves, code changes through Codex, automatic repair, weekly reports, Givebutter donations and fundraisers, the newsletter sign-up and consent-gated Google Analytics all work. What is still open:

## Accounts and recovery

- [ ] Sanity: confirm plan/usage limits and a backup library administrator.
- [ ] Rehearse a CMS restore from the weekly backup (`assistant/MAINTENANCE.md`, "CMS backups") that doesn't depend on any one person's computer.
- [ ] Keep the private account directory (owners and recovery, no passwords) current in the library ChatGPT Maintenance project (Sources).
- [ ] Confirm who handles expired sign-ins, quotas and billing.

## Volunteers

- [ ] A primary and a backup volunteer complete the workflow on their own.
- [ ] Board connects Instagram in Buffer when ready; verify a draft before claiming it works.

## Repository and automation

- [ ] Branch protection on `main` (require a PR and the `check` workflow, block force-pushes and deletion) and a ruleset on `maintenance-reports` (block deletion and force-pushes).
- [ ] Confirm that maintenance alerts reach someone who reads them.
- [ ] Picture generation for the assistant needs a separate OpenAI API account and key (open).
- [ ] Creating or changing Givebutter campaigns from the assistant is not wired up; the Givebutter connection in ChatGPT is read-only.

## Old website

- [ ] Retire the old Square website and cancel its subscription only with board approval and its owner. Keep the domain registration (Squarespace) and email.
