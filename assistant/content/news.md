# Blog posts and library news

Use the news wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Edit Sanity **Blog posts**, not the old `editorial.ts` migration input.

A `post` uses `title`, `slug.current`, `summary`, `category` and `body` (native Portable Text). `publishedAt` is the displayed article date; setting a future date does not schedule publication. Preserve an existing slug when correcting a post. A new slug determines its `/news/<slug>/` address. Never build that link for a volunteer yourself: give the checked link from the PR comment "What this save puts on the live website".

A post without its own `image` shows a library photo that fits its topic (the website never leaves an empty picture box). If a volunteer wants no photo, say so and show them the preview before saving. Use `image` for the optional cover and `gallery[]` for additional native `libraryImage` assets. Each picture needs useful `alt` text; captions are optional. Include only photos approved for public use. Original CMS assets may be publicly accessible; do not promise that processing the website image removes metadata from the original upload.

Use `eventRefs[]` to reference existing events instead of maintaining duplicate dates. Read the referenced event before writing a recap. Portable Text uses native blocks/spans; keep stable `_key` values when editing arrays. Imported destination/source fields are for actual imported material, not required new-post fields.

For a correction, update the existing CMS draft and preserve unrelated edits. Before unpublishing/removing a post, check inbound links and shared assets. Never delete a picture merely because this post no longer uses it.

Save a draft through permitted tools and show the proposed post here. After confirmation, use the supported CMS publishing tool to queue a website preview; it does not finish the website update. Follow [publishing workflow](../WORKFLOW.md) for exact-version approval and hosted verification. Offer social follow-up after the requested work, without blocking it.

Field definitions: `studio/schemas/documents.ts`, `studio/schemas/objects.ts`.
