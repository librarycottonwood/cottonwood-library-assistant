# Donations, newsletters and social updates

Read the current records and available tools before acting; setup notes are not a permanent connection guarantee.

## One library workflow

ChatGPT gathers the facts and drafts the message. Sanity holds website content and the newsletter PDF archive. Givebutter holds the approved payment destination, donor records, newsletter signups and email delivery. Buffer holds Facebook/Instagram drafts and publishing. Reuse the same confirmed event/news facts and links across them; never maintain a second event calendar or donor list in the CMS.

The board reviews the proposed content. Frequently changing website content is saved entirely in the library chat with Sanity and GitHub tools. Page-file text, layout and design use the prepared Codex environment. Both use a current-content preview, chat approval, checked merge and verified live save. Social posts remain drafts until approved. For email, show the exact subject, body and intended newsletter audience before sending. The official Givebutter ChatGPT connection is read access, including messages already sent; it does not create or send email. Inspect actual tool capabilities. When write tools are absent, provide the prepared newsletter and guide the final action in Givebutter Engage. Do not pretend chat can send, create widgets or update campaign settings merely because it can report totals.

## General donations

- Campaign: **Support Your Local Library**, numeric dashboard ID `655849`, short code `R62NJU`.
- Public destination: https://givebutter.com/support-your-local-library-r62nju
- Public widget account: `D4OkqF0zVDUb7Rdx`. Existing Button widget: `p5MJ0G` (the website's custom buttons use the account and campaign codes, not this widget ID).
- The campaign has no fixed goal; automatic goal stretching is off. Checkout offers one-time and monthly gifts.
- These are saved in the published Sanity `library-settings` record (`library.donationUrl`, `library.givebutter.{account,campaign}`).

Never select an older Giving Tuesday campaign as the default just because it is active. Read current `library-settings` and `library-giving` before changing destinations. A special fundraiser is separate from general donations; its Form widget, goal, dates and checked website update must be confirmed. See `content/fundraisers.md`.

## Email newsletter

Drafts and sending happen in Givebutter **Engage → Email**; sender settings are under **Engage → Settings → Senders**. The library uses Givebutter's free sending address, with replies to `cottonlib@shasta.com`; no custom-domain mailbox or paid service.

- Sign-ups: the website's own form (footer of every page and `/newsletter/`, `src/components/site/NewsletterForm.astro`) posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**. `src/content/newsletter-signup.json` holds the audience name and Turnstile site key. The privacy page explains the collection and unsubscribe link.
- Mailing audience: Givebutter contacts tagged **Library Newsletter**, excluding unsubscribed/suppressed contacts. That one tag is the whole list. The retired widget `L4EVDm` was only used for setup testing; its **Widget form sign-ups → Library Newsletter** group is not a second audience, so don't add it. Do not equate all donors or the shared contact spreadsheet with newsletter subscribers.
- Sender: **Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>** (sending domain `cottonwoodlibrary.givebutter-mail.com`), reply-to `cottonlib@shasta.com`. The library logo, brand color `#193B32`, website logo link and postal address **PO Box 1807, Cottonwood, CA 96022** are saved. Unsubscribe is Givebutter's built-in link.
- No audience import, bulk delivery or recurring email schedule is authorized by default. Use a board-approved issue and recipients for each send. A test delivery needs a specifically approved inbox.

### Volunteer requests

- “Where does Donate go?” Read the CMS destination and Givebutter campaign; answer with its name and working link.
- “How much did we raise this month?” Use Givebutter aggregate reports and state dates; website button clicks are not completed gifts.
- “Put this newsletter on the website and email subscribers.” Read the issue, save/update its CMS record and current-issue selection, follow checked website approval, then draft a short Engage email linking to the verified issue. Confirm the newsletter audience and exact message before a send.
- “Share it on Facebook.” Reuse that verified issue link, create a Buffer draft, and verify the channel. Instagram is not connected until the board connects it; do not claim it is available.
- “How did it do?” Keep website visits/clicks, email delivery/clicks and completed gifts as separate figures with their actual reporting source and dates.

Official references: [Givebutter ChatGPT read access](https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account), [signup forms and audience filtering](https://help.givebutter.com/en/articles/9061803-how-to-embed-a-signup-form-widget-on-your-website), [Engage sending setup](https://help.givebutter.com/en/articles/5497885-how-to-connect-your-domain-to-send-emails-through-engage).
