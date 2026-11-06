# Library crayon illustrations

These are original AI-generated decorative illustrations, created with the built-in imagegen tool for the November 2026 design exploration. They depict fictional children, not library visitors. Real library photography and existing program artwork remain in place.

The transparent PNGs were prepared through `pnpm image:prepare`; `src/content/images.ts` registers them, and `LibraryIllustration` serves small responsive versions through the maintained image component. Their empty alt text and hidden decorative wrapper keep them out of accessible names.

| Source asset | Placement |
| --- | --- |
| `crayon-reading.png` | Homepage library services heading |
| `crayon-playing.png` | Homepage upcoming events heading |
| `crayon-books.png` | Shared newsletter heading |

The prompt set is in `docs/crayon-art-prompts.json`. The direction is very simple original comic children, wobbly graphite crayon outlines, sparse indigo and pale green color, transparent background, no lettering or scenery.

The separate `CrayonUnderline` is a small code-native shape: one continuous uneven stroke and a faint second pencil pass. It has no noise filter, loose flecks, decorative eyebrow marks, or animation. Supporting photo frames use a small offset of the existing pale indigo or green. The opening hero stays unchanged.
