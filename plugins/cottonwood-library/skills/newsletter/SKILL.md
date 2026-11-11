---
name: newsletter
description: Use when a volunteer wants to upload or correct a newsletter issue, email the library newsletter through Givebutter, manage newsletter signup, or share an issue on social media.
---

# Newsletter

Follow library-assistant for conversation and the current CMS publishing route. Technical steps (PDF location, cover picture, summary): repository `assistant/content/newsletter.md`. Read it before editing.

For email delivery, subscribers or a combined website/email/social request, also read current `assistant/COMMUNICATIONS.md`. A website newsletter PDF and an email message are related outputs, not interchangeable. Reuse confirmed issue content and the verified website issue link. Ask which outputs are wanted only when unclear; do not require a PDF for an email-only update.

## Email newsletter

Gather the topic or approved issue, intended newsletter audience and any requested send time. Offer to write the subject and short message from those facts. The audience is Givebutter contacts tagged **Library Newsletter** (the website's sign-up form adds this tag), excluding unsubscribed/suppressed contacts. That one tag is the whole list; the old widget's **Widget form sign-ups → Library Newsletter** group was setup testing, not a second audience; donors and the contact spreadsheet are not automatically newsletter subscribers.

Show the exact draft and audience before a send. Check actual tools: the official Givebutter connection is documented for read access, not email sending. Without a supported write tool, prepare the copy and give the actual Engage link from `assistant/COMMUNICATIONS.md` for final review/sending. Never claim a draft was saved in Givebutter, scheduled or delivered without readback. Do not create a recurring cadence or send to all contacts from a general request to set up newsletters.

For a combined request, finish and verify the website issue first, then use its link in the email and an optional Buffer social draft. For signup or sender problems, inspect the current setup and give one next step; do not ask for passwords or create another mailing service.

## New issue wizard

Ask one at a time; skip what they already said.

1. "Please attach the new newsletter PDF." — required.
2. "What's this issue called?" — suggest one from the PDF.
3. "Should I write the short summary from the newsletter?" — default yes; read the PDF and write two sentences.
4. "Want a news post or Facebook post saying it's out?" — after saving, use the news or social skill.

Use the PDF's first page as the cover picture. The new issue replaces the current one on the site; keep the older PDF file available unless they ask to remove it.

Every issue also gets a **Word version (accessible)**, made by you from the PDF with "Accessible Word version" below. Don't ask whether to make it and don't explain how; it is part of saving an issue. The website offers it for download next to the PDF, so people using screen readers can read the newsletter.

Preview, then ask to save. Before "Ready to save?", show the volunteer in one or two plain lines: the issue name, the summary, and "I also made an accessible Word version" with the .docx attached so they can open it. Share the preview link as the publishing skill says. For a corrected PDF, make a fresh Word version from the new PDF.

## Accessible Word version

Adapted, with permission, from Stephanie McLaughlin's (Chico State) "Accessible PDF to Word" skill. Do this yourself for every new or replaced newsletter PDF. Priorities: the exact wording, a logical reading order, and real Word structure, over looking like the PDF.

**Read the whole PDF first.** Use its text where it is reliable. Read every page as a picture too: words that are only inside pictures (flyers, logos, headings drawn as art) are content. Never treat missing text as missing content.

**Keep the wording.** Copy the newsletter's words exactly, in the order a reader would follow (usually top to bottom, then left column before right). Don't summarize, shorten, correct grammar or "improve" anything. Join lines broken only by the layout into normal paragraphs, and keep real paragraph breaks. Fix a reading error only when the right text is clear from the page. Check names, dates, times, amounts and phone numbers against the page picture.

**Build it with real Word structure** (python-docx or the chat's document tools):

- The newsletter's title (for example "CHECK IT OUT….") uses **Heading 1**, never the Title or Subtitle style. Each article or section heading uses **Heading 2**; a heading inside a section uses **Heading 3**. Don't skip a level. A heading drawn as a picture (a "Storytime" logo) can be the section's Heading 2 when that is what it means.
- Everything else uses Normal. No text boxes, floating text or columns.
- Lists are real bulleted or numbered lists. Tables are real tables with a header row.
- Keep links that are in the PDF.
- Remove page numbers and anything repeated on every page. Keep one-time information such as the library's address and hours, once, at the end.
- Set the document title (for example "Cottonwood Community Library newsletter, Fall 2026") and the language English (United States).

**Pictures.** Keep pictures that carry information (photos, logos of sponsors, flyers). Give each a short, specific description (alt text) in the picture's Description: who or what it shows, and any words in it that the text doesn't already say. Mark purely decorative pictures (borders, leaves, flowers, clip art that repeats a heading) as decorative in Word (the `adec:decorative` setting, with an empty description), or leave them out. A flyer that is all words: give it a short description, and put its words in the document as text right after it.

**Check it, and fix what you find yourself.** Make a list of anything uncertain while you work: hard-to-read words, an unclear heading or reading order, a table, a picture you can't describe confidently, a link you couldn't recover. That list is Stephanie's "Manual Review" section. Resolve each item yourself by looking at the PDF page again. Only ask the volunteer about a real fact you cannot confirm from the PDF (for example a smudged date or a name you can't read), one question at a time, naming the page. When every item is resolved, the Word file has **no** "Manual Review" section.

Before saving, open the finished .docx again and confirm: the title is Heading 1; headings go 1, 2, 3 without skipping; lists are real lists; every picture has a description or is decorative; the reading order matches the PDF; nothing from the PDF is missing; no "Manual Review" section is left. The website refuses a Word file that fails these checks, and the preview names the problem.

**Save it** to the issue's **Word version (accessible)** field, the same way as the PDF: upload the .docx you made with the Sanity upload tool for chat files (`dataset_assets_upload_from_web_chatgpt`, asset type `file`, file name `cottonwood-library-newsletter-<page address>.docx`), wait for it to finish, then set the newsletter's `accessibleFile` to `{"_type": "file", "asset": {"_type": "reference", "_ref": "<the file asset id>"}}`. Upload it before publishing the newsletter record.
