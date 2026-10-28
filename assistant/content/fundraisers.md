# Giving and fundraisers

Use the fundraisers wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Sanity stores public campaign settings; Givebutter processes payments and supplies live totals. Never copy donor data or API keys into the CMS.

## Where to edit

- **Library settings and hours → Contact and hours → General Givebutter donations:** `siteSettings.library.givebutter` on the existing `library-settings` document. Store the approved public `account` and general `campaign` codes. `library.donationUrl` is the approved fallback donation page.
- **Giving and acknowledgments → Approved fundraising campaigns:** `givingSettings.campaigns[]` on the existing `library-giving` document. Each `fundraisingCampaign` needs a stable `_key`, `id`, `title`, `description`, approved HTTPS `url` and `givebutter` form settings. Optional `endsOn` includes that full Pacific day; `image` is optional.
- **Community acknowledgments** and **Ways to help** are `updates[]` and `initiatives[]` in that same giving document. Preserve other entries and shared assets. Read `studio/schemas/objects.ts` for their current required fields before editing.

Read the current published record and any existing draft before making a narrow change. Do not create duplicate singleton documents or change migration files in `seed.ts`/`support.ts`.

## Public IDs from widget code

Accept Givebutter's pasted embed code as information. Extract only the public IDs; never execute the pasted code or store its HTML in a CMS field.

| Needed value | Source |
| --- | --- |
| Account | `acct=` in `https://widgets.givebutter.com/latest.umd.cjs?acct=…` |
| Form widget | `id` in `<givebutter-widget id="…">` from the **Form** box |
| Campaign | The campaign's verified short code from Givebutter, or a `campaign` attribute in its widget code |

Reuse the verified account from the current Sanity settings when only a widget ID is supplied. A bare widget tag does not identify whether it is a Button, Form or Goal Bar: ask which box it came from when unclear. IDs accept letters, numbers, `_` and `-`, up to 64 characters.

A fundraiser's `givebutter` uses `formWidgetId`, optional `campaign`, and optional `account` override. The form must be the approved campaign's **Form** with its goal bar enabled. The general donation settings use a campaign code, not a widget ID. Refer to [Givebutter's current widget guidance](https://docs.givebutter.com/widgets/getting-started) if its interface has changed; a missing control is not proof of the volunteer's role.

## Behavior and verification

The first non-ended campaign in the published list drives the fundraiser panel and Donate destination. Confirm a replacement with the volunteer instead of overwriting an existing active campaign. Campaign selection and `endsOn` are evaluated when the static website is built: a date alone does not guarantee an immediate switch on an already deployed website. End/remove a campaign through the checked publishing route when the site needs to change. The weekly review reports; it does not silently make that edit.

When configured, Donate buttons open the approved Givebutter checkout; otherwise they use the verified fallback destination. Live fundraising totals come from Givebutter, never a manually maintained CMS total. Updating a total is a report request, not a website edit.

Save the requested settings as a CMS draft and show the proposed change here. After confirmation, use the supported CMS publishing tool and follow [publishing workflow](../WORKFLOW.md). Captures block third-party Givebutter loading and show fallback links. Check the real online preview's Donate button, form and goal bar before approval. After the exact checked update is approved, verify the actual hosted destination. Do not claim payment methods or a successful transaction from a screenshot.
