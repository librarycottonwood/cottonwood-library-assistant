# Library crayon illustrations

These are original AI-generated decorative illustrations, created with the built-in imagegen tool for the November 2026 design exploration. They depict fictional children, not library visitors. Real library photography and existing program artwork remain in place.

The transparent PNGs were prepared through `pnpm image:prepare`; `src/content/images.ts` registers them, and `LibraryIllustration` serves responsive versions through the maintained image component. The wide scenes are 320px on desktop and 240px on phones; the single book-carrying child is 160px and 128px. Their empty alt text and hidden decorative wrapper keep them out of accessible names.

| Source asset | Placement |
| --- | --- |
| `crayon-reading.png` | Homepage library services heading |
| `crayon-playing.png` | Homepage upcoming events heading |
| `crayon-books.png` | Shared newsletter heading |
| `crayon-community.png` | Above the homepage community heading; four children holding hands |

The original prompt set is in `docs/crayon-art-prompts.json`; the holding-hands scene and its reading-scene style reference are documented in `docs/crayon-community-prompt.json`. The direction is very simple original comic children, wobbly graphite crayon outlines, sparse indigo and pale green color, transparent background, no lettering or scenery.

Illustrations sit above their headings, centered on the same axis. The community scene follows the user's suggestion of children holding hands in a line.

The separate `CrayonUnderline` is a small code-native shape: one continuous uneven stroke and a faint second pencil pass. It emphasizes the last word of the hero's second line and the community heading, preserving the CMS wording. It has no noise filter, loose flecks, decorative eyebrow marks, or animation.

Photo frames share the `shadow-photo` and `shadow-photo-reverse` tokens: a small pale indigo or green offset, including the hero, event/service cards, split blocks, wide photos and galleries. The hero's clipping frame owns its inset, keeping the image's existing settling animation inside it. Logos, newsletter page cards and contained gallery artwork retain plain frames.
