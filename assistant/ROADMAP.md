# Cottonwood Library: roadmap to handoff

Updated November 5, 2026. Done so far: the redesigned website (with motion and the Donate/Volunteer call to action under the hero), Sanity editing, end-to-end content saves from the library ChatGPT, Codex code changes, automatic repair and weekly reports, Givebutter donations and the Under One Roof fundraiser, the website's own newsletter sign-up, and consent-gated Google Analytics. Status details: [HANDOVER.md](HANDOVER.md).

## Public launch: by Thursday, November 5, 2026 (moved from November 3)

Only when Jaden says “launch”:

- [ ] Point the domain at the website ([DOMAIN-LAUNCH.md](DOMAIN-LAUNCH.md)), keeping registration and email untouched.
- [ ] Wait for the certificate; check bare and www HTTPS, redirects from old Square addresses, downloads and phone/desktop layouts.
- [ ] Bring PR #68 (search engines, real-domain Analytics, assistant polish) up to date, check and merge it; upload the ChatGPT plugin it bumps (0.2.21).
- [ ] Set Sanity to “Always allow”; add the domain in Givebutter so Apple Pay works; add a Google Analytics launch-day note.
- [ ] Recheck the site the next day. Keep the old site's settings recorded until the new one is verified.

## Wizard tests (November 5)

- [x] Closure notice and its undo passed (PRs #100/#101). Newsletter email draft passed.
- [x] Fixed in PR #102: fundraiser dead end without the Givebutter Form code; undo leaving a hidden Sanity draft; Monday reminder created without asking, and “stop” only pausing it.
- [x] Newsletter issue upload passed up to the preview (PR #105, not saved, cleaned up). Its “email Todd to close the PR” dead end is fixed in this PR.
- [ ] Volunteers get the #102 fixes when the ChatGPT plugin is uploaded at launch (0.2.21, with PR #68).

## Launch week

- [ ] Board approves the relaunch Facebook post and newsletter, then they go out.
- [x] Unsubscribe: not tested by us; accepted November 5. Givebutter adds its own Unsubscribe link to every newsletter (test sends show a placeholder), and the website form never re-subscribes someone who unsubscribed (tested in code).
- [x] Newsletter spam check (Turnstile) verified working November 5. Cloudflare's “siteverify isn't being called” banner only covers the last 24 hours.
- [ ] Fix the backup Codex environment's setup so `pnpm install` works (it failed creating `~/.local/share/pnpm`).
- [ ] Board connects Instagram when ready; verify a draft before claiming it works.

## Before handoff

- [ ] Sanity: nonprofit plan decision, plan/usage limits and a backup library administrator.
- [ ] Back up CMS records and photos, and rehearse a restore that doesn't depend on Jaden's computer.
- [ ] Week of November 23 (fall break): keep the automatic upkeep running; name the library contact for an outage.
- [ ] Week of November 30: review the first website, newsletter and donation results, with date ranges and limitations.

## Week of December 7: handoff and closeout

- [ ] Deliver an account directory (owners and recovery, no passwords; draft in [ACCOUNTS.md](ACCOUNTS.md)), a short board guide, final content and photo exports, and tested backup/restore and rollback steps.
- [ ] A primary and a backup volunteer complete the workflow without Jaden. Confirm who handles expired sign-ins, quotas and billing after the semester.
- [ ] Retire the old Square website and cancel its subscription only with board approval and its owner. Keep the domain registration (Squarespace) and email.
- [ ] The library accepts the final scope and knows the remaining limitations and support arrangement.

## Sources and scope

Drive [Weekly Deliverables](https://docs.google.com/document/d/1B4DKhP4bpmaMiQ3R_Feq-1qr33MunxwouhGEbAKE5h4/edit), last modified October 14; [September 22 notes](https://docs.google.com/document/d/1sFRSB84bcXLM4ax2RHasTVlhTK1mj_hjci7tnPeD8jM/edit) require preserving the old site until replacement and coordinating its eventual retirement. October 20 feedback/access are Jaden's direct report. Runtime/publishing acceptance comes from `CMS.md`, `WORKFLOW.md` and actual workflow evidence; unverified items remain unchecked. This plan adds no paid subscription, bulk email, imported contact list or registrar transfer; the public-domain launch happens only when Jaden says so.
