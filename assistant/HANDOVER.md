# Library account handover — October 6, 2026

Jaden reports the board accepted the custom-site pivot and wants six weeks to try preview changes and connected reports. Keep the existing public website working during that pilot.

## Ready now

- Library-owned ChatGPT Plus account verified in Safari.
- [Library assistant project](https://chatgpt.com/g/g-p-6ac589c205f48191b9442d139323e4f3/project) created. Friendly project instructions saved and reopened to verify them; account-wide library preferences also saved. Training use disabled and verified.
- Official Givebutter plugin connected to Cottonwood Community Library account 170378, authorized as cottonlib@shasta.com. [Report test chat](https://chatgpt.com/c/6ac58a24-19b4-83e8-9f87-3b679a9b0b6a) returned October 1–6 $0/0 successful transactions, then campaign names, statuses and totals matching the real dashboard. Total raised across the five campaigns: $9,756. These are fundraising totals, not verified net receipts or payouts. A fresh project chat also returned the Summer Superhero event’s $7,311/completed status in two friendly sentences.
- librarycottonwood@gmail.com is now an Administrator on the separate Cottonwood Community Library Analytics account, alongside Jaden. Access table verified; no notification email sent. Demo traffic appears in realtime. Automatic assistant reporting is not connected.
- Squarespace domain access recovered and verified. Registrant: Mary Ann Hasbrook; contact: cottonlib@shasta.com. Dashboard displays renewal March 7, 2027 for $15, lock on, and forwarding to the current Square site. Domain settings are unchanged.

## Next: website editing access

1. Library GitHub account **librarycottonwood** is created and verified. The private repository has been transferred to it; Jaden retains write access. Local origin is updated.
2. Library ownership is in place. Later arrange a library organization with two human owners. Review pending demo changes; do not silently substitute an older preview for the demonstrated version.
3. Library ChatGPT is connected to GitHub as librarycottonwood. Its cloud environment has passed setup checks; preview credentials and startup configuration are saved. The environment is published. A fresh library-account task changed the homepage heading, checked desktop/phone screenshots and uploaded a draft; its hosted homepage and pictures page were independently fetched successfully. That first task could not fetch its old preview host; the replacement editor and save/undo tests below now pass.
4. Use cottonwood-library-editor for fresh requests. Hosted preview/capture and repository save/undo are tested. Inline image embeds remain paused; approval uses the working website and hosted pictures page. Public-domain publishing is not configured.
5. Give the board a stable trial link and a short start guide. Gather their feedback on wording, edits and reports during the six-week trial. Launch comes after that review and a tested publishing/rollback mechanism.

## Facebook: what to request

Ask the board member who controls the Page to invite Jaden through Meta Business Suite to the library Page, with Insights access first; Content access only if approved posting is in scope. Send the Page URL as well. They keep their own Facebook passwords. Human Page access is the first step, not a tested ChatGPT connector. Select and test the reporting connection after access is granted; start with read-only reports.

## Givebutter giving page

The campaigns “Support Your Local Library” and “Support Our Story” are unpublished. The older Giving Tuesday 2025 form is active; other campaigns are completed. Choose and review an appropriate ongoing donation campaign with the library before changing the website's donation destination. No campaigns were published or modified and no payments were submitted during setup.

## Optional: move the domain to Spaceship

Spaceship currently advertises .com transfer $9.48 and regular transfer/renewal $9.98, including one additional year; checkout must confirm the actual charge. These are annual costs.

Use a library-owned Spaceship account. First record DNS, nameservers, forwarding and email settings; the Squarespace DNS screen inspected did not provide a complete record export. Plan how the existing Square forwarding will remain available during the trial. Spaceship warns that old registrar default nameservers stop working after a transfer, so retaining their names alone is insufficient.

Then unlock the domain, request the transfer code to the registrant contact, enter it at Spaceship, review the exact charge/settings, and complete the approved transfer. Squarespace says transfer can take up to 15 days and DNS edits are unavailable while pending. No transfer code requested, domain unlocked, purchase made, or DNS changed yet. Editing trials do not depend on moving the registrar.

Sources: [Squarespace transfer guide](https://support.squarespace.com/hc/en-us/articles/205812338-Transferring-a-domain-away-from-Squarespace), [Spaceship transfer/pricing](https://www.spaceship.com/domains/transfer/), [Givebutter ChatGPT guide](https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account), [Codex cloud environment guide](https://learn.chatgpt.com/docs/environments/cloud-environments).

## Hosting ownership and credential handover

Library Cloudflare account **e05729fd6b6fad329e31896d8b1c2da9** is owned by librarycottonwood@gmail.com. The dedicated **cottonwood-library-trial-preview** Pages project has production branch `production` and no library domain attached. Its unchanged baseline draft, review page and both PNGs were independently verified HTTP 200: [preview](https://862c6539.cottonwood-library-trial-preview.pages.dev/), [pictures](https://862c6539.cottonwood-library-trial-preview.pages.dev/_review/).

A library-owned Pages Write API token is saved as a network secret restricted to api.cloudflare.com. Keys and passwords stay out of this repository. The old environment's Edit action failed, so replacement **cottonwood-library-editor** is published from [setup chat](https://chatgpt.com/local/01a113de-0008-720f-b48f-f64648182038), with tested install/start instructions, library account/project values and allowed preview domains. A fresh task passed 36 desktop/phone checks, uploaded using the library credential, and fetched the hosted site and pictures. [Start with this checked editing chat](https://chatgpt.com/local/01a113e6-7d73-7234-8dec-b99078fb703a), or open a new Codex chat and choose cottonwood-library-editor. [Fresh checked preview](https://413d8621.cottonwood-library-trial-preview.pages.dev/). The old environment and Jaden token still exist for prior task references; they are not the pilot entry point.

Humans retain account recovery, identity verification and billing responsibility. A library-controlled password manager should hold recovery access; none has been configured here. No recurring maintenance schedules are enabled yet.

## Trial saving verified

The library-account GitHub connector has write permission, despite the cloud shell lacking a git credential helper. A reversible test saved only the reviewed heading in commit **49f9d90841e4784052879622519847dac2c6f722**, then restored it in **4ee665d0b761674de35a311c60cb8c92c7a60b80**. Remote commits were independently fetched and verified; source is restored and newer instructions preserved.

AGENTS.md, START.md and WORKFLOW.md now explicitly define approved trial saving to main, conflict checks, remote verification and undo, separately from public launch. Missing GitHub permissions did not cause the earlier refusal; the exact earlier chat reasoning is not established.

## Screenshot delivery

Inline screenshot embeds are paused in the instructions. Capture and inspection remain enabled; use the verified website preview and hosted pictures page for approval. Re-enable inline delivery only after a test proves rendering in the library account.

Valid hosted PNGs are rejected by ChatGPT before loading; its absolute cloud-file route also fails. The tested session has no supported native Library upload tool. This remains unresolved. Jaden declined a support report; none was sent. Chrome sign-in is not required or requested.

## Volunteer handoff is not ready

The infrastructure and save/undo tests above passed, but a plain fresh-chat request to see the website failed to recognize the library. Its initial directory is /workspace, while the library AGENTS.md is nested in the repository; no workspace-root AGENTS.md exists. The account-wide Codex instruction field was empty; it has now been saved and reopened to verify (source in assistant/CODEX.md). A subsequent fresh task still reported those instructions were absent from its initial context. Repository response rules have been strengthened, but that is not proof of automatic first-message loading. Finish startup context delivery and validate normal friendly requests before handing the board a new editing chat. Technical setup/test chats have been archived to clean the sidebar.
