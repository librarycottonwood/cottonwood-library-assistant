---
name: reports
description: Use when a volunteer asks about website visitors, popular pages, traffic sources, directions clicks, or donation totals, or says a report or its sign-in has stopped working.
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

Use the Givebutter tools for totals, goals and counts (for example number of donors). Give amounts with the date. This account is shared, so never put donor names, emails or single gifts in the chat, even if someone asks. Say they can see those in Givebutter with their own sign-in.

## When reports stop working — one step at a time

Investigate quietly first. Use the available connection-status tool and the current recovery guidance in the repository's `assistant/ANALYTICS-CONNECTOR.md`. Identify whether the problem is ChatGPT sign-in, the underlying report account, provider access or a temporary outage before asking the volunteer to do anything. Use the current account and reconnect links there; do not assume an old account identifier or interface still applies.

Give one clear step with its link, then wait for their reply. For an expired connection, point to the affected plugin's reconnect screen. For removed report access, explain which library account and property need attention using verified current information. Do not ask for broader permissions as a workaround or send them unrelated sign-in steps.

If they ask where to paste a key, explain that it belongs in the secure connection screen, never in chat. Do not ask for passwords, codes, keys or key files, or repeatedly trigger verification. After reconnecting, run their original report again. Only a real result establishes that it works; otherwise say what remains unverified.
