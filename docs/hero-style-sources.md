# Handwriting and leaf accents

The chosen homepage treatment uses Caveat for the final word. The temporary picker and rejected highlighter treatments have been removed.

## Type

[Caveat](https://fonts.google.com/specimen/Caveat), Copyright 2014 The Caveat Project Authors, comes from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/caveat). The locally hosted variable WOFF2 is subset to Latin and punctuation; its SIL Open Font License is retained in `src/assets/fonts/Caveat-OFL.txt`.

`Handwritten` owns the font, indigo color and three restrained variants: the selected hero treatment, a slightly smaller heading accent, and a short thank-you sign-off. `AccentHeading` preserves the complete incoming text and accents only an explicitly named phrase. An absent phrase leaves the heading plain.

Current public uses are the homepage hero, “Community” in its support invitation, “time” in the Support Us volunteer invitation, and the About page’s thank-you. These examples establish the pattern without applying it to every heading. Usage limits are in `docs/design-rules.md`.

## Leaves

Original SVG geometry in `src/assets/decorations/leaves-{sprig,pair,branch}.svg` uses the existing indigo, green and pale-indigo tokens. Each variant is decorative and excluded from the accessible heading text.

| Variant | Placement |
| --- | --- |
| Upright sprig | About Us, “A place of our own” |
| Paired shoot | Support Us, “Thank you to our supporters” |
| Horizontal branch | Volunteer page, “Other ways to help” |

`LeafAccent` sizes these continuously with the viewport. `Section` keeps each leaf and its plain heading together in the existing entrance group. Leaves are separate from handwriting and crayon scenes.
