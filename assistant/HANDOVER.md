# Library handoff

The library owns its ChatGPT Plus, GitHub repository and Cloudflare account. ChatGPT's display handle is **@cottonwoodlibrary**; the GitHub username is **librarycottonwood**. Renaming the ChatGPT profile does not rename GitHub or Google.

## Volunteer entry points

- Questions, writing and fundraising reports: ChatGPT Work, with Cottonwood Library and the official connected Givebutter plugin.
- Website changes: Codex → Choose environment → **cottonwood-library-editor**. Show a checked draft before saving.
- Saved trial: https://trial.cottonwood-library-trial-preview.pages.dev/ ; its computer/phone pictures are at `/_review/`.
- Weekly summary: one Monday-afternoon cloud task. Its current binding and validation are recorded in setup-status.json.

The obsolete cottonwood-library-assistant saved environment was deleted on October 7. The platform's confirmation states existing tasks/running environments remain available. There is one published volunteer editor. Daily GitHub repair workers do not depend on that editor.

## Instructions and code

Canonical volunteer guidance: `plugins/cottonwood-library/skills/library-assistant/SKILL.md`. AGENTS.md retains repository authority and points to that guidance; START.md is only its startup entry point. The installed plugin contains a released snapshot, so changing its source does not automatically update ChatGPT. Current installed release and any unpublished changes belong in setup-status.json.

Content comes from `src/content/`; shared components from `src/components/`. `assistant/WORKFLOW.md` owns editing, review, saving and undo. `assistant/MAINTENANCE.md` owns maintenance and its schedule prompt. `assistant/ANALYTICS-CONNECTOR.md` contains connector setup and test evidence.

## Remaining account and launch steps

1. Google Analytics: the secure reconnect screen is prepared at https://cottonwood-library-analytics.librarycottonwood.workers.dev/reconnect . The library must approve read-only Google access. If Donna's phone is needed, ask once and wait. Do not send codes or keys in chat. Reports are not connected until a real report succeeds.
2. GitHub identity for the Analytics MCP: the library's existing OAuth app still needs its secret/possible email confirmation. This is separate from the already connected website GitHub plugin. Then install and test the Analytics MCP in the library account, including its weekly cloud access.
3. Facebook: obtain board-authorized Page access and test the actual reporting connection. Do not request anyone's personal Facebook password.
4. Domain: Squarespace registration is recovered. Transfer to a library-owned Spaceship account only after preserving DNS/forwarding and reviewing the actual annual price. No transfer, nameserver change or public-domain launch has happened.

Givebutter's official library connection was tested. The account uses cottonlib@shasta.com. Donation destinations still need board review before launch. Keep the board's existing email addresses; domain DNS inspection found no configured domain inbox/MX service.

Inline pictures remain unavailable in the library cloud chat; checked hosted pictures work. Jaden declined a support report. The six-week trial uses previews and approved source saves; launching the real library domain is separate.

See setup-status.json for current tests and pending gates. Detailed historical rehearsals remain in Git history rather than conflicting append-only status sections.
