# Library crayon illustrations

These are original AI-generated decorative illustrations, created with the built-in imagegen tool for the November 2026 design exploration. They depict fictional children and adults, not actual library visitors or volunteers. Real library photography and existing program artwork remain in place, except the volunteer invitation now uses a relevant illustrated scene instead of a generic shelves photo.

The transparent PNGs were prepared through `pnpm image:prepare`; `src/content/images.ts` registers them, and `LibraryIllustration` serves responsive versions through the maintained image component. Heading scenes scale smoothly at 20vw between 160px and 320px, rather than jumping at a tablet breakpoint. The book-carrying child scales at 10vw between 96px and 160px; the smaller community scene scales at 12vw between 144px and 192px. Responsive image sizes follow those same ranges. The larger footer scene retains its separate 288px cap. Their empty alt text and hidden decorative wrapper keep them out of accessible names.

| Source asset | Placement |
| --- | --- |
| `crayon-reading.png` | Homepage upcoming events heading |
| `crayon-computers.png` | Homepage library services heading |
| `crayon-books.png` | Shared newsletter heading |
| `crayon-community.png` | Above the homepage community heading; four children holding hands |
| `crayon-volunteers.png` | Support Us volunteer invitation; two adults sorting books together |
| `crayon-footer.png` | Footer reading scene, beside the links and contact details on desktop |

The original prompt set is in `docs/crayon-art-prompts.json`; the holding-hands scene and its reading-scene style reference are documented in `docs/crayon-community-prompt.json`. The computer and footer scenes are documented in `docs/crayon-services-footer-prompts.json`. The direction is very simple original comic children, wobbly graphite crayon outlines, sparse indigo and pale green color, transparent background and no lettering. The earlier playing scene is no longer shipped; the reading pair now accompanies events.

Section illustrations sit above their headings at a restrained size on phones. The smaller community scene follows the text column's left edge above its heading; centered section titles keep their artwork centered. The community scene follows the user's suggestion of children holding hands in a line.

Photo-and-text sections retain left-aligned copy and action rows. Headings use balanced wrapping, and the short community introduction balances its line lengths to avoid a lone trailing word. Featured-event summaries use the regular body size.

Main page titles reuse the same scenes in the space to the right: reading for Events & News and News, computers for Explore Services, the book-carrying child for Visit Us and Newsletter, and children holding hands for About Us and Support Us. On phones, the artwork moves above the centered title. Breadcrumbs and supporting text remain with the title. Article, event-detail and legal page titles stay plain.

The footer's old low-opacity logo watermark is replaced by one crayon reading scene. At 1024px and wider, the three information columns and artwork share one row. Tablet and phone layouts center the scene below the information. The stacked library logo and social links form one centered group; larger layouts keep this group in the first column. On phones, the information columns share a centered area capped at 512px, with more room for contact details and a smaller gap between columns. Contact links retain their touch targets without extra gaps between rows; the mailing address has one small separation. Artwork is capped at 288px and shrinks to the available content width on the narrowest phones. The scene is decorative, responsive and lazy-loaded.

The hero keeps both complete CMS heading lines in black. An original static SVG uses two uneven indigo strokes with crayon grain beneath the final word, separate from the letters. It has no miniature icon and enters with the existing heading group. The community heading stays plain. The volunteer invitation uses a contained pale-indigo band with an illustration of adults sorting books beside left-aligned copy and an action; on phones the scene is centered above the copy at no more than 224px wide. The whole band shares one entrance. Its final built-in imagegen prompt is in `docs/crayon-volunteers-prompt.json`.

Tablet and desktop opening hours keep their indigo background, white type and original vertical spacing. Phones use a quiet strip on the page background with dark text: short weekday labels and unchanged hours align in two columns, with the clock aligned to the first row. The full CMS day names remain available to screen readers. Long or enlarged text can reflow.

Photo frames share the `shadow-photo` and `shadow-photo-reverse` tokens: a small pale indigo or green offset, including the hero, event/service cards, split blocks, wide photos and galleries. The hero's clipping frame owns its inset, keeping the image's existing settling animation inside it. Logos, newsletter page cards and contained gallery artwork retain plain frames.

Homepage service cards retain the original photo-and-copy layout with the shared photo insets and readable full descriptions.

Below 768px, photo cards, wide photos and full-width split photos use a 3:2 frame that grows with their width. This avoids shallow letterbox crops on wider phones. Inset service photos keep their taller 5:4 shape; logos and printed newsletter pages retain their dedicated sizing, and contained artwork continues to show whole.

The shared newsletter signup sits on a white paper panel with a pale indigo folded corner. The book-carrying child peeks above the paper's top edge. All decoration stays outside the text and controls; the original form, labels, messages and newsletter link remain in place. Phones stack the email field and Sign up button at full width.
