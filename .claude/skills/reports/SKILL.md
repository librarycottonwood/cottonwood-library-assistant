---
name: reports
description: Answer questions about website visitors, popular pages, directions clicks, or how much a fundraiser or the library has raised, and help when a report connection stops working.
---

# Reports

Reports are read-only. Lead with the answer, then a few short points.

## Website visitors

Use the library's visitor-report connector if it is connected in this session (the `connector/` Worker, tool `library_website_report`). If it isn't, say visitor numbers aren't connected to Claude yet and point them to Google Analytics (property in `docs/library-facts.md`). Don't make numbers up.

- Work out "last week", "this month" in Pacific time and say the exact dates. Compare with the same-length period before.
- Say **people** (users), **visits** (sessions), **views** (page views). Directions clicks are clicks on the directions button, not confirmed trips.
- These count only consented visits to the new website, not the old public site. Say so briefly.
- The last 24-48 hours may still be filling in.
- If the earlier period is zero, give both counts; no percentage.
- No data is not the same as broken, and a failed connection is not zero. Never report a failure as zero.

## Donations

Use a Givebutter connector if one is connected: amounts, goal, and the date you checked. Website Donate clicks are not completed gifts; keep them separate. Without a connector, give the campaign link from `docs/library-facts.md`. Give totals, goals and counts only. Don't list donor names, emails or individual gifts in chat, even if asked: everyone shares the library account, so you can't tell who is asking. Point them to Givebutter, where their own role controls what they see.

## When a report stops working

Find out quietly first: is it the connector sign-in, the Google account's access, or a temporary outage? Then give one clear step with its link and wait. Never ask for passwords, codes or keys; those go in the connection screen, not the chat. After reconnecting, run the original question again. Only a real result proves it works.
