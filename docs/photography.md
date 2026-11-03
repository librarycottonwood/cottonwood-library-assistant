# November 2026 photography refresh

Page photographs were reviewed against the shared Drive folder and the library's
Facebook and Instagram accounts on November 3, 2026. The original computer-room
reconstruction approved in chat is included. No live CMS records were changed.

The new JPEGs were prepared with the repository's image preparation script
(upright, metadata removed, maximum dimensions and file-size checks), registered
in the image catalog, and rendered through the existing responsive Astro images.
Original repository pictures, logos, certificates, portraits and historical
artwork remain available.

## Sources and selection

Shared folder: [Photos and Logo](https://drive.google.com/drive/folders/1Pq_0y-cUI5VxOSaFyewj76bZSvxZTCWw).
The folder contained 41 images and the additional
[Unused Library Pics](https://drive.google.com/drive/folders/1dnoEbxeCRzFAcmsQlFUOWYijcUE1b8WS)
folder. The Facebook photo grid was reviewed through roughly 120 loaded photos;
many were dated flyers. Instagram's first 12 posts were reviewed for suitable
subjects, with the Main Street Readers carousel inspected separately.

The following are **AI reconstructions of the real place**, made with the built-in
image generation tool, not new documentary photographs. The prompts requested the
existing room/building, better camera alignment and soft daylight. Small lettering
and book covers can differ. Do not use them to establish library facts or prices.

| Prepared asset | Reference |
| --- | --- |
| borrowing-shelves-v2.jpg | [Drive library interior](https://drive.google.com/file/d/1G2aAPoxIyJbGNqfxbsHBWohC-WQH8OVA/view) |
| computers-wifi-v2.jpg | Original photo supplied and reconstructed in this chat |
| copy-room-v2.jpg | [Drive copier room](https://drive.google.com/file/d/1n_A7ij4ayDhRQZYuSVzn-p8AM3Jneaxj/view) |
| library-entrance-v2.jpg | [Drive entrance](https://drive.google.com/file/d/1E6Psu0o1GzszNLHvTAxFU-ZU5ti7zre3/view) |
| storytime-room-v2.jpg | [Drive Story Time setup](https://drive.google.com/file/d/1HOtJQjXBKySYix0BWi5GgEg-amUqxhr6/view) |
| reading-table-v3.jpg | Calm book-and-table composition referenced to the [Drive library interior](https://drive.google.com/file/d/1G2aAPoxIyJbGNqfxbsHBWohC-WQH8OVA/view) |
| book-sale-shelves-v2.jpg | Existing back-hall-bookshelf.jpeg |
| childrens-book-sale-v2.jpg | Existing book-sale-childrens.jpeg |
| reading-nook-v2.jpg | [Drive reading nook](https://drive.google.com/file/d/1uNluPrLGzMi0RNlFHmHKOUhyuy38gCUK/view) |
| book-drop-v2.jpg | Existing caterpillar-book-drop.jpg; [Drive original](https://drive.google.com/file/d/1ZtvAaWXaO91G9p8K5jP6Iecykizb3tco/view) |
| holiday-market-v2.jpg | Existing holiday-market-storefront.jpg |

The following retain the **original photographs**, without generative changes to
people, faces or artwork:

| Prepared asset | Source and context |
| --- | --- |
| library-exterior-original.jpg | [Drive CCL.jpeg](https://drive.google.com/file/d/1FvsI5fI2QxC0slpyjH5r1q7k_0deKLLn/view), original building photograph with web resizing/compression only; no generative edits |
| storytime-session.jpg | [Instagram Story Time](https://www.instagram.com/cottonwoodcommunitylibrary/p/Dd2xjaRm_Qw/), a volunteer reading to children |
| library-roof-original.jpg | [Drive actual roof and entrance](https://drive.google.com/file/d/1KcWd87_JRDerE3cIhFNfdt1q9-kxPht_/view), used for the roof fundraiser |
| storytime-facebook.jpg | [Facebook June 24 photo](https://www.facebook.com/photo.php?fbid=961347140271185), volunteer reading to children |
| adventure-mural-original.jpg | [Drive full mural photograph](https://drive.google.com/file/d/1m6h_licjfExXICSM640FRTQdmMOD1xzu/view), replaces the tiny Figma screenshot crop |

The generated junior-book variant and both generated exteriors were rejected
for invented details. None is registered or served. Exterior photographs must
use original source pixels with web preparation only, including the hero and
About Us gallery. The crowded junior
display, Main Street Readers portrait and close exterior were also rejected
during preview review; their page appearances now use the reading table, actual
community Story Time photograph and original exterior.

## How replacements work

src/content/photography.ts explicitly selects the refreshed version of each known
default local key or exact existing Sanity asset URL. The image components resolve
that choice before choosing the description, cover/contain fit and focal point.
This keeps cards, detail pages and CMS-backed appearances consistent without
rewriting Sanity records or old seed content. A new CMS image URL takes priority
over local aliases and passes through unchanged. Unrelated images pass through.

The reading groups use a calm library reading-table composition and the polished
reading-nook view. Book-donation artwork becomes the book-and-table composition;
the community support block shows the real Facebook Story Time gathering. The news
fallback rotation uses library places and activities instead of repeating artwork.
The historical About Us paintings, portraits, plaque, certificates and murals are
preserved; the gallery's low-resolution exterior is refreshed. Roof fundraisers
use the actual building/roof photograph consistently in event cards and detail
pages, rather than a randomly selected book display. Later CMS event uploads
still take priority.

## Generation records

Exact prompts for this batch, including the rejected junior-book variant, are in
[photography-prompts.json](photography-prompts.json). The approved computer image's
prompt is saved in [computers-wifi-prompt.txt](computers-wifi-prompt.txt).

Full-resolution PNGs and downloaded source references are retained locally under
output/photo-refresh/ in the task worktree. The output directory is ignored;
the optimized selected JPEGs in src/assets/images/ are the site assets.
