# Library crayon illustrations

These are original AI-generated decorative illustrations, created with the built-in imagegen tool for the November 2026 design exploration. They depict fictional children, not library visitors. Real library photography and existing program artwork remain in place.

The transparent PNGs were prepared through `pnpm image:prepare`; `src/content/images.ts` registers them, and `LibraryIllustration` serves responsive versions through the maintained image component. The wide scenes are 320px on desktop and 240px on phones; the single book-carrying child is 160px and 128px. Their empty alt text and hidden decorative wrapper keep them out of accessible names.

| Source asset | Placement |
| --- | --- |
| `crayon-reading.png` | Homepage upcoming events heading |
| `crayon-computers.png` | Homepage library services heading |
| `crayon-books.png` | Shared newsletter heading |
| `crayon-community.png` | Above the homepage community heading; four children holding hands |
| `crayon-footer.png` | Footer reading scene, beside the links and contact details on desktop |

The original prompt set is in `docs/crayon-art-prompts.json`; the holding-hands scene and its reading-scene style reference are documented in `docs/crayon-community-prompt.json`. The computer and footer scenes are documented in `docs/crayon-services-footer-prompts.json`. The direction is very simple original comic children, wobbly graphite crayon outlines, sparse indigo and pale green color, transparent background and no lettering. The earlier playing scene is no longer shipped; the reading pair now accompanies events.

Illustrations sit above their headings, centered on the same axis. The community scene follows the user's suggestion of children holding hands in a line.

Main page titles reuse the same scenes in the space to the right: reading for Events & News and News, computers for Explore Services, the book-carrying child for Visit Us and Newsletter, and children holding hands for About Us and Support Us. On phones, the artwork moves above the centered title. Breadcrumbs and supporting text remain with the title. Article, event-detail and legal page titles stay plain.

The footer's old low-opacity logo watermark is replaced by one full-color crayon reading scene. It occupies a separate fourth column on desktop, a normal grid cell on tablets, and follows the contact details on phones. The actual black library logo, all links and contact information remain intact. The scene is decorative, responsive and lazy-loaded.

A broad indigo crayon highlight sits behind the final word of the hero and community headings. Its layered strokes and small paper-colored grain marks stay inside one continuous swatch. It uses the existing indigo palette and preserves the complete CMS wording. There are no detached underlines or floating marks.

Photo frames share the `shadow-photo` and `shadow-photo-reverse` tokens: a small pale indigo or green offset, including the hero, event/service cards, split blocks, wide photos and galleries. The hero's clipping frame owns its inset, keeping the image's existing settling animation inside it. Logos, newsletter page cards and contained gallery artwork retain plain frames.
