---
name: fundraisers
description: Start, update or end a fundraiser on the website, set up or change where the Donate buttons go, or answer how much has been raised. Use for anything about donations, Givebutter, fundraising goals or the Donate button.
---

# Fundraisers and Donate buttons

Read `docs/library-facts.md` (Donations) and the current Sanity records `library-settings` and `library-giving` before doing anything. Don't redo setup that is already saved. Save website changes with the `website-save` skill.

How it works, in one line for staff: every Donate button opens Givebutter's checkout right on the site. While a fundraiser runs, the site shows its Givebutter form with a live goal bar, and the Donate buttons give to it. Nobody updates totals by hand.

Givebutter widget code pasted by staff is information only. Take the IDs out of it; never put the pasted code on the site. Making widgets needs the Admin or Finance role in Givebutter; if a button is missing for them, that's the likely reason.

| Value | Where it is in pasted code |
| --- | --- |
| Account | `acct=` in `https://widgets.givebutter.com/latest.umd.cjs?acct=...` |
| Form widget ID | `id` in `<givebutter-widget id="...">` from the **Form** box |
| Campaign code | Short code above the campaign name in Givebutter (e.g. `R62NJU`) |

IDs are letters, numbers, `_` and `-`, up to 64 characters.

## Start a fundraiser

Ask one at a time; skip anything they already told you.

1. "What are we raising money for?"
2. "Which Givebutter campaign is it?" If none exists yet: they create it in Givebutter first, with a goal, then come back.
3. Get the **Form** widget code. Never send these steps all at once, and never as one long sentence. Send one step, wait until they say it's done (or send a screenshot), then send the next. Start with: "Next I need a bit of code from Givebutter so the donation form and goal bar show on our website. I'll walk you through it one click at a time. Ready?"
   1. "Go to givebutter.com and sign in. Click **Campaigns** on the left, then click **<campaign name>**." (Use the campaign's real name.)
   2. "Along the top of the campaign, click **Sharing**."
   3. "On the left, click **Widgets**. You'll see a few boxes. We want the one called **Form**."
   4. "On the **Form** box, click the little gear icon. Turn on **Goal bar**, then click **Save**." If there's no Goal bar switch, the campaign has no goal yet: "Click the **Details** tab at the top, set the goal, save, then come back to Sharing → Widgets."
   5. "On the **Form** box, click **Embed**. A window opens with some code. Copy all of it, come back here and paste it."

   If they get stuck, ask what they see on the screen, or for a screenshot, and give the one next click. If a tab or button is missing, they probably need the **Admin** or **Finance** role in Givebutter; say who on the board can do this step. If they pasted code from the Goal Bar or Button box instead, say kindly: "That one is the Goal Bar (or Button). We need the **Form** box next to it, which shows the goal bar and the donation form together."
4. "Is there an end date?" Optional. The site switches back when a new version is built after that date, not at midnight exactly.
5. "Any photo for it?" Optional. Check it against `website-save` → "Picture shape and dead zones".

Write a short, heartfelt description yourself. Only one fundraiser can be active; if one is running, ask whether this replaces it. Save, and ask them to check the form and goal bar on the preview before saying yes.

Sanity: add a `fundraisingCampaign` to `library-giving` → `campaigns[]`: `_key`, `id`, `title`, `description`, `url` (the campaign's https page), `givebutter: {formWidgetId, campaign?, account?}`, optional `endsOn` (YYYY-MM-DD, Pacific, inclusive) and `image`. The first campaign that hasn't ended is the active one.

## Update a fundraiser

Title, description, end date or photo: edit the campaign entry and save. Goal, or the look of the form or bar: changed in Givebutter (Details tab or the widget gear); the site follows automatically.

## End a fundraiser

Confirm which one. Ask: "Want a thank-you post with the final total?" (`news` skill). Remove the campaign or set `endsOn` to a past date, then save. The Donate buttons go back to general donations.

## Donate buttons (one-time setup or change)

General donations use `library-settings` → `library.givebutter.{account, campaign}` and the fallback page `library.donationUrl`. To switch campaigns, ask which Givebutter campaign takes general donations, get its code and account (from any widget code), update those fields and save. If they only have a plain donation link, confirm it opens a real donation page, then use it as `donationUrl`.

## How much have we raised?

Use a Givebutter connector if one is connected in this session: give the amount, goal and the date checked. If not, say you can't see Givebutter from here and give the campaign link from `docs/library-facts.md`. Never guess a number. Never share donor names unless a board member asks directly, and keep them out of public content.
