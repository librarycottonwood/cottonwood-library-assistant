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

Illustrations sit above their headings. The community scene follows the text column's left edge; centered section titles keep their artwork centered. The community scene follows the user's suggestion of children holding hands in a line.

Photo-and-text sections retain left-aligned copy and action rows. Headings use balanced wrapping, and the short community introduction balances its line lengths to avoid a lone trailing word. Featured-event summaries use the regular body size.

Main page titles reuse the same scenes in the space to the right: reading for Events & News and News, computers for Explore Services, the book-carrying child for Visit Us and Newsletter, and children holding hands for About Us and Support Us. On phones, the artwork moves above the centered title. Breadcrumbs and supporting text remain with the title. Article, event-detail and legal page titles stay plain.

The footer's old low-opacity logo watermark is replaced by one small crayon reading scene. At 1024px and wider, the three information columns and artwork share one row. Medium layouts keep all three information columns together, with artwork below the brand; phones put Explore and Get in touch beside each other under the compact brand, followed by a small right-aligned illustration. Artwork is capped at 288px on desktop and 192px below it. The actual black library logo, links and contact information remain intact. The scene is decorative, responsive and lazy-loaded.

Hero and community headings use plain type with their complete CMS wording. The illustrations provide the decorative detail.

The opening-hours strip uses a slim pale-indigo band, deep-indigo utility text and abbreviated weekday names. It retains the full CMS wording for assistive technology, keeps each schedule together when wrapping, and stays compact on desktop as well as phones.

Photo frames share the `shadow-photo` and `shadow-photo-reverse` tokens: a small pale indigo or green offset, including the hero, event/service cards, split blocks, wide photos and galleries. The hero's clipping frame owns its inset, keeping the image's existing settling animation inside it. Logos, newsletter page cards and contained gallery artwork retain plain frames.

Homepage service cards retain the original photo-and-copy layout with the shared photo insets and readable full descriptions.

The shared newsletter signup sits on a white paper panel with a pale indigo folded corner. The book-carrying child peeks above the paper's top edge. All decoration stays outside the text and controls; the original form, labels, messages and newsletter link remain in place.
