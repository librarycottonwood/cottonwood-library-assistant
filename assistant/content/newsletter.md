# Newsletters

Use the newsletter wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Create or correct a Sanity **Newsletters** record, not files or settings in `seed.ts`.

A `newsletter` has `issue`, `title`, `slug.current`, `summary`, a native PDF `file.asset._ref` and a `cover` picture with useful `alt` text. Generate a cover from the PDF's first page when the available tools permit it; otherwise guide the volunteer through uploading a cover in Studio. Do not pretend a file was uploaded when it is only attached to chat. Confirm the actual file asset is a PDF.

For a new issue, preserve older newsletter records and PDFs. In **Library settings and hours → Homepage → Current newsletter**, change `siteSettings.currentNewsletter` on the existing `library-settings` document to reference that issue. This selection drives the current-issue page and homepage card; older issues remain in the archive. Do not create another settings document or maintain a second current-issue copy.

For a correction to the same issue, keep its document identity and page address. Replacing a PDF does not authorize deleting the previous asset when it may still be shared.

Prepare both the issue and current-selection drafts as needed, then show the proposed issue and selection here. After confirmation, publish the exact records through supported CMS tools. Use Studio only for an unavailable operation. The published selection must reference a published, valid newsletter. The current website preview reads published records only. Follow [publishing workflow](../WORKFLOW.md), then check the current download, cover and older archive download on the verified website.

Field definitions: `studio/schemas/documents.ts`; singleton IDs: `studio/structure.ts`. `legacyFileUrl` is migration-only; new issues use native file assets.
