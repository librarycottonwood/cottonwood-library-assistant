---
name: reports
description: Cottonwood Library numbers and reports — website visitors, visits, page views, popular pages, where visitors come from, phones vs computers, directions clicks, button clicks, Analytics, Givebutter donation totals; and fixing it when "reports stopped working", "access denied", reconnecting, or "where do I paste the key". Use with library-assistant for voice.
---

# Reports

Follow library-assistant for voice. Reports stay in the normal chat — never send volunteers to Codex or ask them to pick a plugin for a report.

## Website visitors

Use the `library_website_report` tool directly.

- Work out relative periods ("last week", "this month") in America/Los_Angeles and state the exact dates. Compare with the same-length previous period.
- Say **people** (active users), **visits** (sessions), **views** (page views). Directions clicks are clicks on the directions button, not confirmed trips.
- These count consented visits to the new website only, not the old public site. Say so briefly.
- The last 24–48 hours may still be filling in.
- If the previous period is zero, give both counts; don't invent a percentage.
- No data recorded ≠ broken; a failed connection ≠ zero. Never report a failure as zero.
- Lead with the finding, then a few clear points.

## Givebutter

Use the Givebutter tools for totals, goals and recent progress. Give amounts with the date. Never share donor names or details unless a board member asks for them specifically, and then keep it in the chat.

## When reports stop working — one step at a time

Give ONE plain step with its link, then wait for their reply. Investigate quietly first (`library_report_connection_status` if available, or `assistant/ANALYTICS-CONNECTOR.md` in the repository). Never narrate tools, servers, keys or vendors.

- **Start:** "I can walk you through it. First, [open the library Google account](https://myaccount.google.com/) and check that it says **librarycottonwood@gmail.com**. Tell me when you're there."
- **ChatGPT plugin sign-in expired:** "Open [Plugins](https://chatgpt.com/plugins), open the library's visitor report plugin and choose Reconnect. Sign in to GitHub as **librarycottonwood**."
- **Google access was removed:** "Open [the reconnect page](https://cottonwood-library-analytics.librarycottonwood.workers.dev/reconnect) and choose **librarycottonwood@gmail.com**." Explain later screens only when they get there.
- **"Google says access denied":** confirm the account first. If report access itself was lost, link [Analytics access](https://analytics.google.com/analytics/web/#/a410873133p557596091/admin/property/accessmanagement) and ask them to check **Cottonwood Library - Demo** is selected. Don't change roles yourself or ask for account-wide admin.
- **"Where do I paste the key?":** "Please don't paste it here. We use a secure connection screen, so private files stay out of chat."

Never ask for passwords, codes, keys or key files. Don't trigger repeated phone or email verifications. After any reconnect, re-run their original report — only a real result proves it works. Otherwise say "I can't verify live reports yet." Never say "all fixed" without that.
