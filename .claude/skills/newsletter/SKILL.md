---
name: newsletter
description: Put a new or corrected newsletter issue (PDF) on the website, draft the email newsletter for Givebutter, or help with newsletter sign-ups. Use when someone has a newsletter PDF, wants to email subscribers, or asks about the newsletter list.
---

# Newsletter

The website issue (a PDF in Sanity) and the email (sent from Givebutter Engage) are related but separate. Ask which they want only if it's unclear. For a combined request, finish and check the website issue first, then use its link in the email and in any social post. Facts: `docs/library-facts.md` (Newsletter).

## New issue on the website

Ask one at a time; skip anything they already told you.

1. "Please attach the newsletter PDF." Required.
2. "What's this issue called?" Suggest one from the PDF (e.g. "Winter 2026").
3. "Should I write the short summary from the newsletter?" Default yes: read the PDF and write two sentences.
4. "Want a news post or Facebook post saying it's out?" After saving, use the `news` or `social` skill.

Then in Sanity:
- Upload the PDF as a file asset (`assetType: file`) and a cover picture (an image of the first page, if you can make one; otherwise ask for one or use the editor). See `website-save` → Photos for the upload steps.
- Create a `newsletter` record: `issue`, `title`, `slug.current`, `summary`, `file` (the PDF asset), `cover` (image with alt text).
- Point `library-settings` → `currentNewsletter` at the new issue. Older issues stay in the archive; don't delete old PDFs.

Save with `website-save`. On the live site, check the current-issue page, its download, and one older download.

A correction to the same issue keeps its record and address; replace only what's wrong.

## Email newsletter

1. Gather the topic or approved issue, and any requested send time.
2. Write the subject line and a short message, linking to the website issue if there is one.
3. Show the exact draft and the audience: **Library Newsletter sign-ups**, unsubscribed contacts excluded. Donors are not automatically subscribers.
4. Claude can't send from Givebutter. Give the subject and message as separate copy blocks, send the Engage link from `docs/library-facts.md`, and wait. Then give one click at a time based on what they say they see; don't name buttons you haven't seen. Never say it was saved, scheduled or sent unless they confirm it.

Don't set up a recurring email schedule or send to all contacts from a general request. Before the very first bulk send, remind them the unsubscribe test and board approval are still open.

## Sign-up problems

The sign-up form is the website's own form (in the footer, and on `/librarynews/newsletter/`). It adds people to Givebutter tagged **Library Newsletter**. If someone sees "sign-up isn't working", the usual cause is the Givebutter key missing or expired: a board admin follows "Newsletter sign-up key" in `docs/setup-checklist.md`. Never ask for or handle the key yourself. Check the page on the live site (previews have no key, so the form always shows the error there), then give one next step. Don't create another mailing service.
