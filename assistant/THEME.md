# October 5 custom-site theme refresh

Source: Squarespace rebuild chat 01a0f060-97bd-7590-ae21-db8deb536e45, read with the app's thread tool; its saved starter artwork, HOME-FINISH.md and source facts. The paused Squarespace editor has not been changed. Direct session coordination was blocked by its existing writer; this implementation uses the saved handoff and Jaden's actual messages in that chat.

Jaden's new direction: Sacramento's oversized, roomy graphic design; CCPL's large illustrated actions; Santa Barbara's simple navigation. Santa Fe supplies the calendar idea. Blythe supplies ease of finding information, not its visual design. Minimal copy, one action per row on phones, full-poster artwork, rounded hero corner, real library photographs.

Four approved generated foreground illustrations are copied from the Squarespace starter into src/assets/actions. Their source and prompts remain in the original workspace at research/squarespace-starter/IMAGE-PROMPTS.md. No new artwork was generated for this refresh.

The homepage uses those illustrated actions, a Coming up feature with one large book-sale image and three compact program rows, a forest/photo donation banner, photo-led service links and a visit/map panel. The top-right curve repeats selectively on the hero, featured event photo and donation banner. The hero includes the Main Street address. Shared card styling carries through the child pages. The published October 16–17, 10 a.m.–2 p.m. quarterly book sale is included in the calendar, news and sale details. Regular program schedules are kept separate from dated occurrences; no start-time-only program has been assigned an invented end time.

Map: adapted from ACR Plumbing's ServiceAreaMap.astro in /home/jaden/Developer/ai-agency/clients/acr-plumbing. MapLibre 6.6.0, bundled worker, lazy OpenFreeMap Positron tiles, scroll-safe gestures, visible attribution, library pin and a working address/directions fallback. No API key or account. Coordinates 40.3873866,-122.2805738 verified against the OpenStreetMap library building (way 238196639), matching the old site's existing map pin. No device geolocation requested.

Provider: https://openfreemap.org/ · library building: https://www.openstreetmap.org/way/238196639

The production domain, Givebutter, Facebook Insights and automatic assistant analytics reports remain unconnected. The custom demo does not silently replace the board's platform decision.

Latest design research: inspected Sacramento and Santa Barbara homepages in a browser. Sacramento uses prominent image-led editorial features and a Find Events feature; Santa Barbara separates its news, calendar and direct actions. Adapted that hierarchy to the library’s small program list rather than copying a four-wide card grid. Sources: https://www.saclibrary.org/ and https://library.santabarbaraca.gov/.

Reading-width refinement: wide visual hero/actions/donation panel keep a 1312px outer container; Coming up and visit use 1168px; services use the existing 1024px narrow container. Phone gutters stay consistent. Restores varied section widths and shorter copy measures while keeping approved images, actions and map. Services and featured-sale copy now state the service/event directly.
