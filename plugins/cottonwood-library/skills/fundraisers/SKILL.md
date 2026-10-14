---
name: fundraisers
description: Cottonwood Library fundraisers and donations — start a fundraiser or campaign (new roof, books, a goal), how much has been raised, change a fundraiser, end a fundraiser, or change where the Donate buttons go. Givebutter totals. Use with library-assistant for voice and the preview-then-save rule.
---

# Fundraisers

Follow library-assistant for voice, Chat-vs-Codex and preview → "save it". Technical steps (campaign fields, Givebutter goal bar, donate link): repository `assistant/content/fundraisers.md`. Read it before editing.

How it works: the site shows one active fundraiser with Givebutter's live goal bar, so the total on the website is always current and nobody updates it by hand. While it runs, **every Donate button on the site goes to that fundraiser's Givebutter page**. When it ends, the buttons go back to the library's general donation page automatically.

## Start a fundraiser wizard

Ask one at a time; skip what they already said.

1. "What are we raising money for?"
2. "Which Givebutter campaign is it?" — find it with the Givebutter tools, or ask for the link. If there isn't one yet, explain in one line that they create the campaign in Givebutter first, with its goal (you can walk them through it), then come back.
3. "Please paste the Goal Bar widget code from Givebutter." — if they're not sure where it is, walk them through it one step at a time: open the campaign → **Sharing** tab → **Widgets** → **Goal Bar** → **Embed** → copy. If Goal Bar is greyed out, they set a goal on the campaign's **Details** tab first. Find whatever you can with the Givebutter tools so they paste as little as possible.
4. "Is there an end date?" — optional. With a date, it comes down by itself afterwards.
5. "Any photo for it?" — optional.

Take just the two ids from the pasted code (the repository file shows how) and never put the pasted code itself on the site. Write a short, heartfelt description yourself. Preview and ask to save. Only one fundraiser can be active; if one is already running, ask whether this replaces it.

## How much have we raised?

Read Givebutter and answer with the amount, goal and date. The bar on the website is live, so there's nothing to update.

Never guess a number. If Givebutter isn't available, say so and suggest they check the campaign in Givebutter.

## Change a fundraiser

Title, description, end date or photo → preview and save. The goal or the bar's look → changed in Givebutter (Details tab, or the widget's settings); the website follows by itself.

## End a fundraiser

Confirm which one, then ask: "Want a thank-you post with the final total?" (news skill). Ending it takes the goal bar down and returns the Donate buttons to the general donation page. Preview and save.

## Donate buttons only

If they just want the general Donate link changed (no fundraiser), ask for the new link, confirm it opens a real donation page, then preview and save.
