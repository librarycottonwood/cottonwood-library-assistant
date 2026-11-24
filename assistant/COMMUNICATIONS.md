# Donations, newsletters and social updates

Read the current records and available tools before acting; setup notes are not a permanent connection guarantee.

## One library workflow

ChatGPT gathers the facts and drafts the message. Sanity holds website content and the newsletter PDF archive. Givebutter holds the approved payment destination, donor records, newsletter signups and email delivery. Buffer holds Facebook/Instagram drafts and publishing. Reuse the same confirmed event/news facts and links across them; never maintain a second event calendar or donor list in the CMS.

The board reviews the proposed content. Frequently changing website content is saved entirely in the library chat with Sanity and GitHub tools. Page-file text, layout and design use the prepared Codex environment. Both use a current-content preview, chat approval, checked merge and verified live save. Social posts remain drafts until approved. For email, show the exact subject, body and intended audience (see "Email audiences") before sending. The official Givebutter ChatGPT connection is read access, including messages already sent; it does not create or send email. Inspect actual tool capabilities. When write tools are absent, provide the prepared newsletter and guide the final action in Givebutter Engage. Do not pretend chat can send, create widgets or update campaign settings merely because it can report totals.

## General donations

- Campaign: **Support Your Local Library**, numeric dashboard ID `655849`, short code `R62NJU`.
- Public destination: https://givebutter.com/support-your-local-library-r62nju
- Public widget account: `D4OkqF0zVDUb7Rdx`. Existing Button widget: `p5MJ0G` (the website's custom buttons use the account and campaign codes, not this widget ID).
- The campaign has no fixed goal; automatic goal stretching is off. Checkout offers one-time and monthly gifts.
- These are saved in the published Sanity `library-settings` record (`library.donationUrl`, `library.givebutter.{account,campaign}`).

Never select an older Giving Tuesday campaign as the default just because it is active. Read current `library-settings` and `library-giving` before changing destinations. A special fundraiser is separate from general donations; its Form widget, goal, dates and checked website update must be confirmed. See `content/fundraisers.md`.

## Email audiences

Givebutter holds several groups of people. Pick the right one for each email and say which one you picked and why. Never write a number of people into a file or reply from memory: check the count live with the Givebutter connector each time it matters, with the date.

1. **Newsletter list:** contacts tagged **Library Newsletter** with email subscription on (unsubscribed contacts excluded). Use it only for the newsletter. When a report or anyone asks for "subscribers" or "newsletter subscribers", this is the count.
2. **Everyone opted in to library email:** contacts with email subscription on, whatever their tag (for example donors who agreed to hear from the library at checkout). Use it for library-wide announcements: events, book sales, a fundraiser's launch, milestones and final push, closures that matter, and big library news. Not for routine newsletter content. Keep it modest: about one or two of these a month at most, beyond the newsletter.
3. **Contacts without email subscription:** never email them. Givebutter sends them only receipts and other transactional messages on its own.
4. **Patron or circulation lists** (including the Drive "active patron emails" spreadsheet): never import them into Givebutter or email them. Having someone's email for library cards is not consent to mail them.

Every email to audience 1 or 2 is sent by a person who reviews it in Givebutter **Engage → Email**; Givebutter adds the unsubscribe link. ChatGPT only reads Givebutter: it drafts, names the audience and shows its live count, and never claims an email was sent or scheduled.

### Suggest an announcement when it fits

When a volunteer saves or plans an event, a fundraiser milestone, a book sale or a major notice, ask once, briefly: "Want me to draft an announcement email to everyone who's opted in to library email?" Don't repeat it if they say no, and don't offer it for small changes. If yes: write the subject and short message from the confirmed facts and the verified website link, say it goes to everyone opted in to library email (audience 2) and why, give that audience's live count from the Givebutter connector, and give the Engage link for the person to review and send. If the count can't be read, say so instead of guessing. If a library-wide email already went out in the last few weeks, mention it so they can choose to wait.

## Email newsletter

Drafts and sending happen in Givebutter **Engage → Email**; sender settings are under **Engage → Settings → Senders**. The library uses Givebutter's free sending address, with replies to `cottonlib@shasta.com`; no custom-domain mailbox or paid service.

- Sign-ups: the website's own form (footer of every page and `/newsletter/`, `src/components/site/NewsletterForm.astro`) posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**. `src/content/newsletter-signup.json` holds the audience name and Turnstile site key. The privacy page explains the collection and unsubscribe link.
- Mailing audience: the newsletter list (audience 1 above): Givebutter contacts tagged **Library Newsletter** with email subscription on, excluding unsubscribed/suppressed contacts. That one tag is the whole list. The retired widget `L4EVDm` was only used for setup testing; its **Widget form sign-ups → Library Newsletter** group is not a second audience, so don't add it. Do not equate all donors, everyone opted in to library email, or any patron spreadsheet with newsletter subscribers.
- Sender: **Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>** (sending domain `cottonwoodlibrary.givebutter-mail.com`), reply-to `cottonlib@shasta.com`. The library logo, brand color `#193B32`, website logo link and postal address **PO Box 1807, Cottonwood, CA 96022** are saved. Unsubscribe is Givebutter's built-in link.
- No audience import, bulk delivery or recurring email schedule is authorized by default. Use a board-approved issue and recipients for each send. A test delivery needs a specifically approved inbox.

### Volunteer requests

- “Where does Donate go?” Read the CMS destination and Givebutter campaign; answer with its name and working link.
- “How much did we raise this month?” Use Givebutter aggregate reports and state dates; website button clicks are not completed gifts.
- “Put this newsletter on the website and email subscribers.” Read the issue, save/update its CMS record and current-issue selection, follow checked website approval, then draft a short Engage email linking to the verified issue. Confirm the newsletter audience and exact message before a send.
- “Share it on Facebook.” Reuse that verified issue link, create a Buffer draft, and verify the channel. Instagram is not connected until the board connects it; do not claim it is available.
- “How did it do?” Keep website visits/clicks, email delivery/clicks and completed gifts as separate figures with their actual reporting source and dates.

Official references: [Givebutter ChatGPT read access](https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account), [signup forms and audience filtering](https://help.givebutter.com/en/articles/9061803-how-to-embed-a-signup-form-widget-on-your-website), [Engage sending setup](https://help.givebutter.com/en/articles/5497885-how-to-connect-your-domain-to-send-emails-through-engage).
