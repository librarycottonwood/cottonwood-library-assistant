# Fundraisers: technical steps

Used by the `fundraisers` skill. Follow `assistant/WORKFLOW.md` for checking, preview and save. The Monday weekly task only reports the Givebutter total; it never edits the site.

## Where

`campaigns` in `src/content/support.ts` (type `FundraisingCampaign` in `src/content/types.ts`). The example in that file's header comment shows every field.

```ts
{
  id: 'roof-2026', title: 'New roof fund',
  description: 'Help replace the library roof before winter rains.',
  url: 'https://givebutter.com/<campaign>',              // the real Givebutter campaign page
  givebutter: { account: 'AbC123xYz', goalBarWidgetId: 'gb4Xy7Lm' }, // from the Goal Bar widget code
  endsOn: '2026-12-31',                                   // optional, YYYY-MM-DD Pacific, inclusive
  image: { key: 'exterior', alt: '…' },                   // optional; key must be in images.ts
},
```

The site shows Givebutter's official **Goal Bar widget**, which updates itself. There are no amounts in this file and nothing to update by hand.

## Getting the widget code

1. In Givebutter: **Campaigns** → the campaign (it must be live/published) → **Sharing** tab → **Widgets**.
2. Choose **Goal Bar** → **Embed**, then copy the code from the "How to embed" window. If Goal Bar is greyed out, set a goal on the campaign's **Details** tab first. If Givebutter asks to install the library first, choose "I use another platform" and copy both snippets.
3. The pasted code looks like this:

   ```html
   <script src="https://widgets.givebutter.com/latest.umd.cjs?acct=AbC123xYz&p=other" async></script>
   <givebutter-widget id="gb4Xy7Lm"></givebutter-widget>
   ```

   - `account` = the `acct=` value in the script address (`AbC123xYz`). It is the same for every campaign; reuse it if the volunteer only pastes the widget line.
   - `goalBarWidgetId` = the `id="…"` of `<givebutter-widget>` (`gb4Xy7Lm`).

Copy only those two ids into `support.ts`. Never paste the HTML itself. The build accepts only letters, numbers, `_` and `-` and stops with a plain message otherwise.

## How it behaves

- The **first campaign that hasn't ended** is the active one. It shows the goal bar on the support pages, and **every Donate button** uses its `url` (`getDonateLink()` in `src/content/donate.ts`).
- The Givebutter script loads only on pages that show the active campaign. Without JavaScript, or if the script is blocked (as in `pnpm assistant:capture`, which blocks outside services), a "See progress and give on Givebutter" link to `url` shows instead.
- No active campaign → Donate buttons use `library.donationUrl` in `src/content/seed.ts`, or the library-fund page if that is `null`.
- `endsOn` is applied when the site is built. To be sure the buttons switch back on time, remove the entry when it ends (the weekly task reports ended campaigns).
- Bad values (wrong date format, ids with other characters) stop the build with a plain message.

## Tasks

- **Start:** add the entry at the top of `campaigns`. Only one active campaign: if another is running, remove or end it as the volunteer decides.
- **Edit:** title, description, end date or picture change in `support.ts`. Goal, amount and bar style change in Givebutter (Details tab, or the widget's settings icon) and show up on the site by themselves.
- **How much raised:** read it from the Givebutter tools; never estimate. No website change is needed.
- **End:** remove the entry. Offer a thank-you news post with the final total.
- **General donate link:** set `library.donationUrl` in `src/content/seed.ts` to a real donation page, or `null`.
