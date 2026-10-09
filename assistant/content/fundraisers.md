# Fundraisers: technical steps

Used by the `fundraisers` skill and the Monday weekly task. Follow `assistant/WORKFLOW.md` for checking, preview and save.

## Where

`campaigns` in `src/content/support.ts` (type `FundraisingCampaign` in `src/content/types.ts`). The example in that file's header comment shows every field.

```ts
{
  id: 'roof-2026', title: 'New roof fund',
  description: 'Help replace the library roof before winter rains.',
  url: 'https://givebutter.com/<campaign>',   // the real Givebutter campaign page
  raised: 4250, goal: 12000, currency: 'USD',
  updatedAt: '2026-10-09',                     // date `raised` was read from Givebutter
  endsOn: '2026-12-31',                        // optional, YYYY-MM-DD Pacific, inclusive
  image: { key: 'exterior', alt: '…' },        // optional; key must be in images.ts
},
```

## How it behaves

- The **first campaign that hasn't ended** is the active one. It shows a progress bar on the support pages, and **every Donate button** uses its `url` (`getDonateLink()` in `src/content/donate.ts`).
- No active campaign → Donate buttons use `library.donationUrl` in `src/content/seed.ts`, or the library-fund page if that is `null`.
- `endsOn` is applied when the site is built. To be sure the buttons switch back on time, remove the entry when it ends (the weekly task reports ended campaigns).
- Bad values (wrong date format, goal ≤ 0) stop the build with a plain message.

## Tasks

- **Start:** add the entry at the top of `campaigns`. Only one active campaign: if another is running, remove or end it as the volunteer decides.
- **Update progress (also the Monday task):** change only `raised` and `updatedAt`. Read the amount from the Givebutter tools; never estimate.
- **End:** remove the entry. Offer a thank-you news post with the final total.
- **General donate link:** set `library.donationUrl` in `src/content/seed.ts` to a real donation page, or `null`.
