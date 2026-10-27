# New website foundations

`tokens.ts` is the single source for the new build's design tokens. It generates
the shared `/components/tokens.css` stylesheet and the `/components` directory.
Import `FoundationStyles.astro` into new layouts to load the tokens and self-hosted
Bree Serif and Mona Sans fonts. Use `var(--token-name)` in components.

Source: [Cottonwood Figma redesign](https://www.figma.com/design/ZHygohymNhKRQyxIhQsQ2P/Untitled?node-id=1001-2),
inspected October 21, 2026. Each token links to its source node.

The file has no local variable collections or text styles. Values were extracted
from the desktop homepage and named here. Padding and gaps alias the common
spacing scale. Font sizes use rems based on a 16px root, preserving browser text
scaling. Original desktop measurements are preserved; responsive page sizing is
future component work.

The one-off 94px hero gap and distributed header measurements (822px/1018px)
are intentionally excluded from the reusable scale. SF Pro is used for icon
glyphs in Figma and is not a web text font. No icon system is implemented yet.

The directory's compact documentation layout lives in `catalog.css`, separate
from the new site's tokens. Its specimen panels use the actual shared values.
The old prototype's `global.css` is independent of this foundation.
