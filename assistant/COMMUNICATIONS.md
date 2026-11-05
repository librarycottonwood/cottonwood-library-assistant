# Donations, newsletters and social updates

Updated November 5, 2026. Read the current records and available tools before acting; dated setup evidence is not a permanent connection guarantee.

## One library workflow

ChatGPT gathers the facts and drafts the message. Sanity holds website content and the newsletter PDF archive. Givebutter holds the approved payment destination, donor records, newsletter signups and email delivery. Buffer holds Facebook/Instagram drafts and publishing. Reuse the same confirmed event/news facts and links across them; never maintain a second event calendar or donor list in the CMS.

The board reviews the proposed content. Website updates use the existing Codex PR workflow: current-content preview URL, chat approval, checked merge and verified live save. Social posts remain drafts until approved. For email, show the exact subject, body and intended newsletter audience before sending. Current official Givebutter ChatGPT documentation describes read access, including messages already sent; it does not establish email creation or sending tools. Inspect actual tool capabilities. When write tools are absent, provide the prepared newsletter and guide the final action in Givebutter Engage. Do not pretend chat can send, create widgets or update campaign settings merely because it can report totals.

## General donations: configured October 21

- Campaign: **Support Your Local Library**, numeric dashboard ID `655849`, short code `R62NJU`.
- Public destination: https://givebutter.com/support-your-local-library-r62nju
- Public widget account: `D4OkqF0zVDUb7Rdx`. Existing Button widget: `p5MJ0G` (the website's custom buttons use the account and campaign codes, not this widget ID).
- Givebutter dashboard showed **Active** after publication. The general campaign has no fixed goal; automatic goal stretching is off. One-time and monthly options appeared in its checkout preview. No payment was submitted.
- The published Sanity `library-settings` record now has only these requested changes: `library.donationUrl` and `library.givebutter.{account,campaign}`. Other library settings were preserved and compared with the preceding snapshot.
- Checked October 21 on a preview of the old trial project (since retired; the live site is https://cottonwood-library.pages.dev, run 39698463728). Desktop and 390px phone Donate clicks opened the real campaign checkout. Jaden approved through the authenticated page; publish run 39699898818 passed. Hosted website status matches operation 2ca87551-2750-4229-8131-24d69ef7e53d and release 095c8809236035d62c20e38f8e5f27a7a85d90bfb09c4174bdbccd4a8affae7a. No transaction submitted.

Never select an older Giving Tuesday campaign as the default just because it is active. Read current `library-settings` and `library-giving` before changing destinations. A special fundraiser is separate from general donations; its Form widget, goal, dates and checked website update must be confirmed. See `content/fundraisers.md`.

## Email newsletter setup

Engage email drafts and sending: https://dashboard.givebutter.com/accounts/170378/engage/email . Sender settings: https://dashboard.givebutter.com/accounts/170378/engage/settings/senders .

Jaden chose a free Givebutter sending address with replies to `cottonlib@shasta.com`; no new custom-domain mailbox or paid service was requested.

- History: the signup widget **Library Newsletter**, public widget ID `L4EVDm` (dashboard widget `107689`), was created October 21. It is no longer on the site. The website's own form (footer of every page and `/newsletter/`) now posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**.
- Old widget title: **Stay connected with your library**. Description: **Sign up for Cottonwood Community Library news, events, book sales and ways to help. You can unsubscribe at any time.**
- Mailing audience: Givebutter contacts tagged **Library Newsletter**, excluding unsubscribed/suppressed contacts. That one tag is the whole list. The old widget `L4EVDm` was only used for setup testing on the preview site; its **Widget form sign-ups → Library Newsletter** group is not a second audience, so don't add it. Do not equate all donors or the shared contact spreadsheet with newsletter subscribers.
- Free sending domain **Connected**: `cottonwoodlibrary.givebutter-mail.com`. Verified sender: **Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>**, reply-to `cottonlib@shasta.com`. Existing library logo, brand color `#193B32`, public website logo link and organization postal address **PO Box 1807, Cottonwood, CA 96022** are saved. Jaden confirmed the approved test email arrived (October 21). The website's own sign-up form was tested end to end on October 30, 2026. Unsubscribe test: November 5, result pending. The unused typo sender was removed with explicit authorization.
- History (October 21): the first integration put the Givebutter widget on `/newsletter/` and the footer of every page. It loaded locally with optional first/last names and required email; the approved test signup returned success and appeared as the sole widget-audience recipient; the checked integration was approved and deployed. Today the form is `src/components/site/NewsletterForm.astro`, and `src/content/newsletter-signup.json` holds the audience name and Turnstile site key. This setup is separate from CMS newsletter issue content. The privacy page explains the collection and unsubscribe link.
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
3. **Signup passed October 21:** approved test address submitted through the real widget and read back as the sole recipient in **Library Newsletter Subscribers**, filtered to **Widget form sign-ups is Library Newsletter**. The website's own form (which replaced the widget) passed an end-to-end sign-up test on October 30, 2026. Unsubscribe test: November 5, result pending; confirm it before a bulk send.
4. **Sender/domain, branding, postal address and inbox delivery passed October 21.** Jaden confirmed receipt. The first real issue and audience still need board review before sending.
5. Fresh library chat understands website issue vs email newsletter, carries forward confirmed facts and uses only available actions. History (October 21, not the current version): existing plugin 0.2.9 was uploaded, refreshed and verified in the library account on October 21; installed newsletter guidance was reopened. Fresh library chats subsequently read the actual newsletter issue/PDF and correct sender/audience, drafted without sending, and created/read back one explicitly TEST ONLY unscheduled Facebook draft. Instagram was absent. The combined 0.2.10 plugin was subsequently installed and read back in the library Safari account with all ten skills enabled. A fresh ordinary question correctly routed design/code to Codex and news to Work/Sanity; no changes were made. PR33 approval-page cleanup is deployed and its actual authenticated Safari page was checked without visible record IDs or hashes.

Official references: [Givebutter ChatGPT read access](https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account), [signup forms and audience filtering](https://help.givebutter.com/en/articles/9061803-how-to-embed-a-signup-form-widget-on-your-website), [Engage sending setup](https://help.givebutter.com/en/articles/5497885-how-to-connect-your-domain-to-send-emails-through-engage).
