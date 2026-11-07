# Library crayon illustrations

These are original AI-generated decorative illustrations, created with the built-in imagegen tool for the November 2026 design exploration. They depict fictional children, not library visitors. Real library photography and existing program artwork remain in place.

The transparent PNGs were prepared through `pnpm image:prepare`; `src/content/images.ts` registers them, and `LibraryIllustration` serves responsive versions through the maintained image component. Heading scenes are 320px on desktop and 160px on phones; the single book-carrying child is 160px and 96px. The smaller community detail is 192px on desktop and 144px on phones. Their empty alt text and hidden decorative wrapper keep them out of accessible names.

| Source asset | Placement |
| --- | --- |
| `crayon-reading.png` | Homepage upcoming events heading |
| `crayon-computers.png` | Homepage library services heading |
| `crayon-books.png` | Shared newsletter heading |
| `crayon-community.png` | Beneath the homepage community actions; four children holding hands |
| `crayon-footer.png` | Footer reading scene, beside the links and contact details on desktop |

The original prompt set is in `docs/crayon-art-prompts.json`; the holding-hands scene and its reading-scene style reference are documented in `docs/crayon-community-prompt.json`. The computer and footer scenes are documented in `docs/crayon-services-footer-prompts.json`. The direction is very simple original comic children, wobbly graphite crayon outlines, sparse indigo and pale green color, transparent background and no lettering. The earlier playing scene is no longer shipped; the reading pair now accompanies events.

Section illustrations sit above their headings at a restrained size on phones. The smaller community scene follows the text column's left edge beneath its actions; centered section titles keep their artwork centered. The community scene follows the user's suggestion of children holding hands in a line.

Photo-and-text sections retain left-aligned copy and action rows. Headings use balanced wrapping, and the short community introduction balances its line lengths to avoid a lone trailing word. Featured-event summaries use the regular body size.

Main page titles reuse the same scenes in the space to the right: reading for Events & News and News, computers for Explore Services, the book-carrying child for Visit Us and Newsletter, and children holding hands for About Us and Support Us. On phones, the artwork moves above the centered title. Breadcrumbs and supporting text remain with the title. Article, event-detail and legal page titles stay plain.

The footer's old low-opacity logo watermark is replaced by one small crayon reading scene. At 1024px and wider, the three information columns and artwork share one row. Tablet and phone layouts center the scene below the information. The library name stays centered beneath the tree at every width. On phones, the social links sit to its right; on larger screens they sit below the brand. Explore and Get in touch remain side by side on phones. Contact rows have visible separation, including extra space before the mailing address. Artwork is capped at 288px on desktop and 160px below it. The scene is decorative, responsive and lazy-loaded.

Hero and community headings use plain type with their complete CMS wording. The illustrations provide the decorative detail.

The opening-hours strip keeps the library's indigo background and white text. Tablet and desktop layouts retain the original larger label type and generous vertical spacing; phones keep the compact 15px treatment. Full weekday names appear at every width; phones show each schedule group on its own row. Schedule groups reflow when space is limited or text is enlarged.

Photo frames share the `shadow-photo` and `shadow-photo-reverse` tokens: a small pale indigo or green offset, including the hero, event/service cards, split blocks, wide photos and galleries. The hero's clipping frame owns its inset, keeping the image's existing settling animation inside it. Logos, newsletter page cards and contained gallery artwork retain plain frames.

Homepage service cards retain the original photo-and-copy layout with the shared photo insets and readable full descriptions.

Below 768px, photo cards, wide photos and full-width split photos use a 3:2 frame that grows with their width. This avoids shallow letterbox crops on wider phones. Inset service photos keep their taller 5:4 shape; logos and printed newsletter pages retain their dedicated sizing, and contained artwork continues to show whole.

The shared newsletter signup sits on a white paper panel with a pale indigo folded corner. The book-carrying child peeks above the paper's top edge. All decoration stays outside the text and controls; the original form, labels, messages and newsletter link remain in place. Phones stack the email field and Sign up button at full width.
