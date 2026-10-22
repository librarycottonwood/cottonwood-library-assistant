# Donations, newsletters and social updates

Updated October 21, 2026. Read the current records and available tools before acting; dated setup evidence is not a permanent connection guarantee.

## One library workflow

ChatGPT gathers the facts and drafts the message. Sanity holds website content and the newsletter PDF archive. Givebutter holds the approved payment destination, donor records, newsletter signups and email delivery. Buffer holds Facebook/Instagram drafts and publishing. Reuse the same confirmed event/news facts and links across them; never maintain a second event calendar or donor list in the CMS.

The board reviews the proposed content. Website updates use the existing checked CMS preview and authenticated approval. Social posts remain drafts until approved. For email, show the exact subject, body and intended newsletter audience before sending. Current official Givebutter ChatGPT documentation describes read access, including messages already sent; it does not establish email creation or sending tools. Inspect actual tool capabilities. When write tools are absent, provide the prepared newsletter and guide the final action in Givebutter Engage. Do not pretend chat can send, create widgets or update campaign settings merely because it can report totals.

## General donations: configured October 21

- Campaign: **Support Your Local Library**, numeric dashboard ID `655849`, short code `R62NJU`.
- Public destination: https://givebutter.com/support-your-local-library-r62nju
- Public widget account: `D4OkqF0zVDUb7Rdx`. Existing Button widget: `p5MJ0G` (the website's custom buttons use the account and campaign codes, not this widget ID).
- Givebutter dashboard showed **Active** after publication. The general campaign has no fixed goal; automatic goal stretching is off. One-time and monthly options appeared in its checkout preview. No payment was submitted.
- The published Sanity `library-settings` record now has only these requested changes: `library.donationUrl` and `library.givebutter.{account,campaign}`. Other library settings were preserved and compared with the preceding snapshot.
- CMS preview check: https://github.com/librarycottonwood/cottonwood-library-assistant/actions/runs/39644721051 . It passed. Immutable preview: https://0a7c3423.cottonwood-library-trial-preview.pages.dev/ . Desktop and 390px phone Donate clicks opened the real campaign checkout in a modal without leaving the preview. No transaction was submitted. The separate authenticated website-save approval remains pending; a checked preview is not trial publication.

Never select an older Giving Tuesday campaign as the default just because it is active. Read current `library-settings` and `library-giving` before changing destinations. A special fundraiser is separate from general donations; its Form widget, goal, dates and checked website update must be confirmed. See `content/fundraisers.md`.

## Email newsletter setup

Engage email drafts and sending: https://dashboard.givebutter.com/accounts/170378/engage/email . Sender settings: https://dashboard.givebutter.com/accounts/170378/engage/settings/senders .

Jaden chose a free Givebutter sending address with replies to `cottonlib@shasta.com`; no new custom-domain mailbox or paid service was requested.

- Signup widget created: **Library Newsletter**, public widget ID `L4EVDm` (dashboard widget `107689`). Static, Email channel, Simple layout, first/last names optional.
- Title: **Stay connected with your library**. Description: **Sign up for Cottonwood Community Library news, events, book sales and ways to help. You can unsubscribe at any time.**
- Mailing audience: Givebutter Contacts / Engage filter **Widget Form Sign-ups → Library Newsletter**, excluding unsubscribed/suppressed contacts. Do not equate all donors or the shared contact spreadsheet with newsletter subscribers.
- Free sending domain **Connected**: `cottonwoodlibrary.givebutter-mail.com`. Verified sender: **Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>**, reply-to `cottonlib@shasta.com`. Existing library logo, brand color `#193B32`, public website logo link and organization postal address **PO Box 1807, Cottonwood, CA 96022** are saved. Inbox delivery still needs an approved test recipient.
- The source integration extends `/librarynews/newsletter/` using `src/components/NewsletterSignup.astro`; public provider IDs live in `src/content/newsletter-signup.json`. This integration configuration is separate from CMS newsletter issue content. The actual Givebutter form loaded locally with optional first/last names and required email. Signup submission and exact checked CMS website approval remain pending. The privacy page explains the collection and unsubscribe link.
- No audience import, bulk newsletter delivery or recurring email schedule has been authorized by this setup request. Use a board-approved issue and recipients for the first send. A test delivery needs a specifically approved inbox.

### Volunteer requests

- “Where does Donate go?” Read the CMS destination and Givebutter campaign; answer with its name and working link.
- “How much did we raise this month?” Use Givebutter aggregate reports and state dates; website button clicks are not completed gifts.
- “Put this newsletter on the website and email subscribers.” Read the issue, save/update its CMS record and current-issue selection, follow checked website approval, then draft a short Engage email linking to the verified issue. Confirm the newsletter audience and exact message before a send.
- “Share it on Facebook.” Reuse that verified issue link, create a Buffer draft, and verify the channel. Instagram is pending the board's connection; do not claim it is available.
- “How did it do?” Keep website visits/clicks, email delivery/clicks and completed gifts as separate figures with their actual reporting source and dates.

## Acceptance to finish

1. Real website Donate opens campaign `R62NJU`, with a usable fallback when scripts are blocked; desktop and phone checked. No transaction required to verify opening checkout.
2. **Passed October 21:** fresh library ChatGPT read the actual published Sanity settings and Givebutter campaign R62NJU, reporting Active and $0 successful donations October 1-21. [Rehearsal](https://chatgpt.com/c/6ad952db-8b30-83e8-9861-f985f941d8f9). This verifies saved settings and reporting, not promotion of a pending website preview.
3. Signup form submits to the **Library Newsletter** audience using an approved test address; unsubscribe/suppression behavior checked before a live send.
4. Sender/domain verification, branding, postal address and test delivery pass. First newsletter is reviewed in Givebutter before sending.
5. Fresh library chat understands website issue vs email newsletter, carries forward confirmed facts and uses only available actions. Existing plugin 0.2.9 was uploaded, refreshed and verified in the library account on October 21; installed newsletter guidance was reopened. The combined email/social rehearsal remains separate.

Official references: [Givebutter ChatGPT read access](https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account), [signup forms and audience filtering](https://help.givebutter.com/en/articles/9061803-how-to-embed-a-signup-form-widget-on-your-website), [Engage sending setup](https://help.givebutter.com/en/articles/5497885-how-to-connect-your-domain-to-send-emails-through-engage).
