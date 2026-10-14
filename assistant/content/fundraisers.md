# Fundraisers: technical steps

Used by the `fundraisers` skill. Follow `assistant/WORKFLOW.md` for checking, preview and save. The Monday weekly task only reports the Givebutter total; it never edits the site.

Givebutter facts these steps rely on (https://docs.givebutter.com/widgets/getting-started and https://help.givebutter.com/en/articles/6464859):

- Every widget belongs to one **live, published** campaign. Widgets are made at the campaign's **Sharing** tab → **Widgets**.
- Only Givebutter users with the **Admin** or **Finance** role can create widgets.
- Apple Pay appears in widgets only after the site's real domain is registered in Givebutter's payment-method settings (a launch step in `assistant/HANDOVER.md`). Venmo appears on computers only, not phones.

## The ids, and how to read them from pasted code

Volunteers paste Givebutter code; you copy **only ids** into the source. Never put pasted HTML on the site. The build accepts only letters, numbers, `_` and `-` (at most 64) and stops with a plain message otherwise.

| Id | Where it is in pasted code | Example |
| - | - | - |
| account | `acct=` in the script address `https://widgets.givebutter.com/latest.umd.cjs?acct=…` | `AbC123xYz` |
| widget id | `id="…"` of `<givebutter-widget …>` | `gb4Xy7Lm` |
| campaign code | `campaign="…"` of a `<givebutter-button>`, `<givebutter-giving-form>` or `<givebutter-goal-bar>` tag; otherwise the `code` of the campaign in the Givebutter tools, or the short letters-and-numbers code shown above the campaign's name in Givebutter | `Q1W2E3` |

The account is the same for every campaign. If the volunteer pastes only the `<givebutter-widget>` line, reuse the account already in `seed.ts`; if there is none, ask for the script line (Givebutter → **Settings** → **Developers** → **Widgets**, or the "Install the library" step Givebutter shows first).

A `<givebutter-widget id="…">` line does not say what kind of widget it is (Button, Form or Goal Bar look identical in code). Ask which box they copied it from. Captures block Givebutter, so ask the volunteer to open the online preview link (`pnpm assistant:preview`) and confirm they see the donation form with its goal bar before saving.

Example of everything a volunteer might paste:

```html
<script async src="https://widgets.givebutter.com/latest.umd.cjs?acct=AbC123xYz"></script>
<givebutter-widget id="gb4Xy7Lm"></givebutter-widget>
```

→ account `AbC123xYz`, widget id `gb4Xy7Lm`.

## Donate buttons (one-time setup)

`library.givebutter` in `src/content/seed.ts` (type `GivebutterLibrary` in `src/content/types.ts`):

```ts
givebutter: { account: 'AbC123xYz', campaign: 'Q1W2E3' } as HomeContent['library']['givebutter'],
```

- `account`: from any pasted widget code (`acct=`).
- `campaign`: the code of the library's **general donation campaign** (not a fundraiser).

While it is `null` (today), every Donate button is a plain link exactly as before.

When set, every Donate button (header, home quick tile, home "Give to the library", news posts and the Donate page, `/fundraising-events/`) keeps its look and analytics but gets `data-gb-account` and `data-gb-campaign`. That is Givebutter's documented "make any website element into a Widget" option (help article above, section "Advanced"): Givebutter's script catches the click and opens the campaign's checkout popup on our site. `checkoutAttributes()` in `src/content/donate.ts` adds them. The `href` stays a real page (`library.donationUrl`, else `https://givebutter.com/<campaign>`), so people without JavaScript, or with Givebutter blocked, still reach the donation page.

The Givebutter script then loads once on every page (`src/layouts/SiteLayout.astro`). The privacy page already says so.

## Fundraisers

`campaigns` in `src/content/support.ts` (type `FundraisingCampaign`). The header comment there shows every field.

```ts
{
  id: 'roof-2026', title: 'New roof fund',
  description: 'Help replace the library roof before winter rains.',
  url: 'https://givebutter.com/<campaign>',   // the real Givebutter campaign page
  givebutter: {
    formWidgetId: 'gb4Xy7Lm',                 // Form widget, made with its goal bar turned on
    campaign: 'R4T5Y6',                       // optional: the fundraiser's campaign code
    // account: 'Other123',                   // only if this fundraiser's acct= differs from library.givebutter.account
  },
  endsOn: '2026-12-31',                       // optional, YYYY-MM-DD Pacific, inclusive
  image: { key: 'exterior', alt: '…' },       // optional; key must be in images.ts
},
```

Getting the Form widget code:

1. Givebutter → **Campaigns** → the fundraiser (live/published) → **Sharing** tab → **Widgets**.
2. On the **Form** box, click the gear (settings) icon and turn on **Goal bar**. Save.
3. Click **Embed** on the Form box and copy the code from the "How to embed" window.

If there is no goal-bar option, the campaign has no goal yet: set one on the campaign's **Details** tab first. The goal, the bar's style and the form's look are all changed in Givebutter later and show up on the site by themselves.

If `account` is missing from both the campaign and `library.givebutter`, the build stops and asks for it.

## How it behaves

- The **first campaign that hasn't ended** is the active one. The Donate page (`/fundraising-events/`) shows its inline Form widget (goal bar inside) at `#give`, with a "See progress and give on Givebutter" link to `url` until the widget loads.
- Donate buttons while it runs (`getDonateLink()`):
  - with `givebutter.campaign` set → they open **that fundraiser's** checkout popup; `href` = `url`.
  - without it → they link to the on-site form, `/fundraising-events/#give`.
- No active fundraiser → `library.givebutter` popup if set; else `library.donationUrl`; else the Donate page, which asks people to call or email until online giving is set up. (`/fundraising-events/library-fund/` is an old address that redirects there.)
- Script: one tag per page. Site-wide when the Donate buttons open a popup; otherwise only on pages showing a fundraiser form (`CampaignProgress.astro`).
- `pnpm assistant:capture` blocks Givebutter, so captures show the fallback links; that is expected.
- `endsOn` is applied when the site is built. To be sure the buttons switch back on time, remove the entry when it ends (the weekly task reports ended campaigns).
- Bad values (wrong date format, ids with other characters) stop the build with a plain message.

## Tasks

- **Set up Donate buttons:** set `library.givebutter` as above. Ask the volunteer to click a Donate button on the online preview link and confirm Givebutter's popup opens.
- **Start:** add the entry at the top of `campaigns`. Only one active campaign: if another is running, remove or end it as the volunteer decides.
- **Edit:** title, description, end date or picture change in `support.ts`. Goal, amount and form/bar style change in Givebutter and show up on the site by themselves.
- **How much raised:** read it from the Givebutter tools; never estimate. No website change is needed.
- **End:** remove the entry. Donate buttons go back to the general popup (or link). Offer a thank-you news post with the final total.
- **General donate link without Givebutter popup:** set `library.donationUrl` to a real donation page, or `null`. If `library.givebutter` is set, `donationUrl` is only the no-JavaScript fallback.
