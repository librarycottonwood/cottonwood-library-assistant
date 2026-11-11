# Newsletters

Use the newsletter wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Create or correct a Sanity **Newsletters** record, not files or settings in `seed.ts`.

A `newsletter` has `issue`, `title`, `slug.current`, `summary`, a native PDF `file.asset._ref`, a `cover` picture with useful `alt` text, and an optional **Word version (accessible)** `accessibleFile.asset._ref` (a `.docx` file asset). Generate a cover from the PDF's first page when the available tools permit it; otherwise guide the volunteer through uploading a cover in Studio. Do not pretend a file was uploaded when it is only attached to chat. Confirm the actual file asset is a PDF.

## Accessible Word version

Every new or replaced PDF also gets an accessible Word version, made by the assistant with the newsletter skill's "Accessible Word version" steps (adapted from Stephanie McLaughlin's "Accessible PDF to Word" skill, Chico State, used with permission). Volunteers do nothing extra. The assistant resolves the skill's "Manual Review" items itself and deletes that section before saving; it asks the volunteer only about a fact it cannot confirm from the PDF.

Upload the .docx it made with the Sanity tool for chat files (`dataset_assets_upload_from_web_chatgpt`, asset type `file`; the same route as an attached PDF), then set `accessibleFile` to `{"_type": "file", "asset": {"_type": "reference", "_ref": "file-<hash>-docx"}}` on the newsletter record before publishing it.

What the website does with it (`src/content/accessible-newsletter.mjs`, checked by `scripts/accessible-newsletter.test.mjs`):

- The newsletter page and the issue page offer **Download PDF** and **Word version (accessible)** side by side. The issue card then opens the issue page, which shows the whole issue as a web page converted from the Word file at build time (Heading 1 becomes the page's h2, pictures keep their descriptions, decorative pictures are left out).
- The build stops, naming the issue and the problem, when the Word file has no Heading 1, skips a heading level, uses the Title style, has a picture with no description that isn't marked decorative, or still has a "Manual Review" section. Fix the Word file, upload it again and point `accessibleFile` at the new file.
- Issues without a Word version look as before: the card opens the PDF.

For a new issue, preserve older newsletter records and PDFs. In **Library settings and hours → Homepage → Current newsletter**, change `siteSettings.currentNewsletter` on the existing `library-settings` document to reference that issue. This selection drives the current-issue page and homepage card; older issues remain in the archive. Do not create another settings document or maintain a second current-issue copy.

For a correction to the same issue, keep its document identity and page address. Replacing a PDF does not authorize deleting the previous asset when it may still be shared.

Prepare both the issue and current-selection drafts as needed, then show the proposed issue, its Word version and the selection here. After confirmation, publish the exact records through supported CMS tools. Use Studio only for an unavailable operation. The published selection must reference a published, valid newsletter. The current website preview reads published records only. Follow [publishing workflow](../WORKFLOW.md), then check the current download, cover and older archive download on the verified website.

Field definitions: `studio/schemas/documents.ts`; singleton IDs: `studio/structure.ts`. `legacyFileUrl` is migration-only; new issues use native file assets.
