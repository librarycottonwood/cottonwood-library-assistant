---
name: fundraisers
description: Use when a volunteer wants to set up Donate buttons, start or end a fundraiser, change its details, or check how much it has raised.
---

# Fundraisers

Follow library-assistant for conversation and the current CMS publishing route. Technical steps (ids, how to read pasted Givebutter code, donate link): repository `assistant/content/fundraisers.md`. Read it before editing.

Read `assistant/COMMUNICATIONS.md` for the library's current general donation campaign and verified setup. Then read the actual CMS settings and Givebutter state. Do not restart one-time setup or ask for identifiers already saved there. General donations use **Support Your Local Library**; a new fundraiser is a separate request.

How it works: once set up, **every Donate button on the site opens Givebutter's checkout right on our website**, so donors never leave the page. A fundraiser shows Givebutter's donation form with its live goal bar, so the total is always current and nobody updates it by hand. While a fundraiser runs, the Donate buttons give to it; ending it through the checked website update returns them to general library donations. After the end date the website stops showing the fundraiser by itself. To remove it from the site's records, say "end the fundraiser" any time after.

Volunteers can just paste Givebutter's code to you. Take only the ids from it (the repository file shows how) and never put the pasted code itself on the site.

Making widgets in Givebutter needs the **Admin** or **Finance** role there. If a button or tab is missing for them, that is the likely reason; someone with that role can do the step.

## Set up the Donate buttons (one time)

For the library's general donation campaign in Givebutter (not a fundraiser). Ask one at a time; skip what they already said.

1. "Which Givebutter campaign takes general donations to the library?" — find it with the Givebutter tools (note its code), or ask for its link. If there isn't one yet, explain in one line that the board creates a simple donation campaign in Givebutter first, then come back.
2. "Please paste any Givebutter widget code from that campaign." If they're not sure where, walk them through it one step at a time:
   1. In Givebutter, click **Campaigns** and open the general donation campaign.
   2. Click the **Sharing** tab at the top.
   3. Click **Widgets** on the left.
   4. On the **Button** box, click **Embed**. (If Givebutter first asks to install the library, choose **I use another platform**.)
   5. Copy the code in the "How to embed" window and paste it here.
3. If you couldn't find the campaign's code with the tools, ask: "One last thing: at the top of that campaign in Givebutter, just above its name, there's a short code of letters and numbers. What does it say?"

Explain in a sentence that their own Donate buttons keep their look; clicking one now opens Givebutter's checkout on the site. Preview, and ask them to click a Donate button on the preview link to see the popup. Then ask to save.

## Start a fundraiser wizard

Ask one at a time; skip what they already said.

1. "What are we raising money for?"
2. "Which Givebutter campaign is it?" — find it with the Givebutter tools (note its code), or ask for the link. If there isn't one yet, explain in one line that they create the campaign in Givebutter first, with its goal (you can walk them through it), then come back.
3. "Please paste the **Form** widget code for it, with the goal bar turned on." Walk them through it one step at a time if needed:
   1. In Givebutter, open the campaign → **Sharing** tab → **Widgets**.
   2. On the **Form** box, click the gear (settings) icon and switch **Goal bar** on. Save.
   3. Click **Embed** on the Form box, copy the code and paste it here.

   If there's no goal bar switch, the campaign has no goal yet: set one on its **Details** tab first, then come back to step 2.
   Any form of the code is fine (with the script line or just the `<givebutter-widget …>` line). If what they pasted is clearly a Goal Bar or Button (for example a `<givebutter-goal-bar>` or `<givebutter-button>` tag), or they say they copied it from that box, kindly explain: "That one is the Goal Bar (or Button). For the fundraiser we need the **Form** one, the box next to it; it shows the goal bar and the donation form together." The plain `<givebutter-widget id="…">` line looks the same for every type, so ask which box it came from if you aren't sure.
4. "Is there an end date?" — optional. After that date the website stops showing the fundraiser by itself; ending it properly ("end the fundraiser") can happen any time after.
5. "Any photo for it?" — optional.

Write a short, heartfelt description yourself. Preview, and ask them to open the preview link and check the form and goal bar appear. Then ask to save. Only one fundraiser can be active; if one is already running, ask whether this replaces it.

## How much have we raised?

Read Givebutter and answer with the amount, goal and date. The goal bar on the website is live, so there's nothing to update.

Never guess a number. If Givebutter isn't available, say so and suggest they check the campaign in Givebutter.

## Change a fundraiser

Title, description, end date or photo → preview and save. The goal, or the form's or bar's look → changed in Givebutter (Details tab, or the widget's gear icon); the website follows by itself.

## End a fundraiser

Confirm which one, then ask: "Want a thank-you post with the final total?" (news skill). Ending it takes the form down and returns the Donate buttons to the general library donation. Preview and save.

## Donate buttons only

If the Donate buttons were never set up with Givebutter, offer the one-time setup above. If they want a different campaign for general donations, run that setup again with the new campaign. If they only have a plain donation link (no Givebutter), ask for it, confirm it opens a real donation page, then preview and save.
