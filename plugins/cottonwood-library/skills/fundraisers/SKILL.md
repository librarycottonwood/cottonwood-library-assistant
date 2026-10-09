---
name: fundraisers
description: Cottonwood Library fundraisers and donations — start a fundraiser or campaign (new roof, books, a goal), update how much has been raised, change the goal, end a fundraiser, or change where the Donate buttons go. Givebutter totals. Use with library-assistant for voice and the preview-then-save rule.
---

# Fundraisers

Follow library-assistant for voice, Chat-vs-Codex and preview → "save it". Technical steps (campaign fields, progress bar, donate link): repository `assistant/content/fundraisers.md`. Read it before editing.

How it works: the site shows one active fundraiser with a progress bar. While it runs, **every Donate button on the site goes to that fundraiser's Givebutter page**. When it ends, the buttons go back to the library's general donation page automatically.

## Start a fundraiser wizard

Ask one at a time; skip what they already said.

1. "What are we raising money for?"
2. "What's the goal?" — a dollar amount.
3. "Is there a Givebutter page for it yet?" — if yes, ask for the link or find it with the Givebutter tools. If not, explain in one line that they create the campaign in Givebutter first (you can walk them through it), then come back.
4. "Is there an end date?" — optional. With a date, it comes down by itself afterwards.
5. "Any photo for it?" — optional.
6. "Want me to keep the total updated every Monday?" — if yes, after saving, note that the weekly check updates the raised amount (the scheduling skill explains it if they ask).

Read the current raised amount from Givebutter. Write a short, heartfelt description yourself. Preview and ask to save. Only one fundraiser can be active; if one is already running, ask whether this replaces it.

## Update progress

"How much have we raised?" → read Givebutter, answer with the amount, goal and date. If the website number is out of date, offer: "Want me to update the website to $X?" — preview and save.

Never guess a number. If Givebutter isn't available, say so and ask for the amount they see.

## End a fundraiser

Confirm which one, then ask: "Want a thank-you post with the final total?" (news skill). Ending it takes the progress bar down and returns the Donate buttons to the general donation page. Preview and save.

## Donate buttons only

If they just want the general Donate link changed (no fundraiser), ask for the new link, confirm it opens a real donation page, then preview and save.
