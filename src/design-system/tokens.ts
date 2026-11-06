/**
 * Design tokens for pages built on BaseLayout. This file is the single source:
 * it generates /components/tokens.css, the /components catalog and docs/design-system.md
 * (`pnpm design:docs`). Every token says what it is for, what it is not for, and shows an example.
 * Rems assume a 16px root.
 */

/** A media-query step: from `minWidth` up, the token takes `value` (always one of the 5 spacing steps). */
export interface TokenStep {
  minWidth: string;
  value: string;
}

export interface Token {
  name: string;
  label: string;
  value: string;
  /** Pixel equivalent or weights, shown next to the value. */
  detail?: string;
  /** What to use it for. */
  useFor: string;
  /** What not to use it for, and what to use instead. */
  avoid: string;
  /** One short CSS or component example. */
  example: string;
  /** Responsive steps. Spacing aliases only ever step between the 5 spacing values. */
  steps?: TokenStep[];
}

export interface TokenGroup {
  slug: string;
  title: string;
  /** CSS property the catalog uses for its previews. */
  property: string;
  /** One plain rule for the group. */
  note: string;
  tokens: Token[];
}

/** The only spacing steps. Component `gap` props accept exactly these names. */
export const spaceSteps = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type Space = typeof spaceSteps[number];

/** Media-query widths used by components (CSS can't read custom properties in media queries). */
export const breakpoints = { tablet: '48rem', split: '64rem', desktop: '90rem', wide: '100rem' } as const;

type TokenInit = Omit<Token, 'name'> & { name: string };
const token = ({ name, ...rest }: TokenInit): Token => ({ name: `--${name}`, ...rest });

export const tokenGroups: TokenGroup[] = [
  {
    slug: 'colors', title: 'Colors', property: 'color',
    note: 'Use the role names below. Do not add new colors or shades.',
    tokens: [
      token({ name: 'color-primary', label: 'Indigo', value: '#4956a7', useFor: 'Primary actions (Donate) and the opening-hours strip.', avoid: 'Body text or large backgrounds behind long text.', example: 'background: var(--color-primary);' }),
      token({ name: 'color-primary-ink', label: 'Deep indigo', value: '#1b2040', useFor: 'Outlined buttons, their labels and borders, badge labels and contact details.', avoid: 'Page background or headings (use --color-text).', example: 'border-color: var(--color-primary-ink);' }),
      token({ name: 'color-primary-soft', label: 'Pale indigo', value: '#e3e7ff', useFor: 'Panels beside a photo: opening hours, a program or event summary (Split panel).', avoid: 'Buttons, text, or the page background (use --color-background).', example: 'background: var(--color-primary-soft);' }),
      token({ name: 'color-accent', label: 'Pale green', value: '#beedae', useFor: 'Supporting actions (directions, donations) and the notices bar.', avoid: 'Text color; it fails contrast on paper.', example: '<Button variant="accent">' }),
      token({ name: 'color-accent-ink', label: 'Leaf green', value: '#3b5c30', useFor: 'Text and icons on pale-green backgrounds.', avoid: 'Text on paper or white (use --color-text).', example: 'color: var(--color-accent-ink);' }),
      token({ name: 'color-background', label: 'Paper', value: '#f7f8ff', useFor: 'The page background.', avoid: 'Cards that must stand out from the page (use --color-surface).', example: 'background: var(--color-background);' }),
      token({ name: 'color-surface', label: 'White', value: '#ffffff', useFor: 'Raised surfaces, badges on photos, and text on indigo.', avoid: 'The page background.', example: 'background: var(--color-surface);' }),
      token({ name: 'color-text', label: 'Black', value: '#000000', useFor: 'Headings and primary text.', avoid: 'Secondary or supporting copy (use --color-text-muted).', example: '<Text>' }),
      token({ name: 'color-text-muted', label: 'Graphite', value: '#525252', useFor: 'Supporting text, dates and secondary icons.', avoid: 'Headings, or text under 16px on colored backgrounds.', example: '<Text tone="muted">' }),
      token({ name: 'color-border', label: 'Soft gray', value: '#d9d9d9', useFor: 'Subtle outlines around badges and dividers.', avoid: 'Text or icons; it is too light to read.', example: 'border: var(--border-thin) solid var(--color-border);' }),
      token({ name: 'color-icon-muted', label: 'Silver', value: '#c1c1c1', useFor: 'Muted icons on the indigo strip.', avoid: 'Anything on a light background.', example: 'color: var(--color-icon-muted);' }),
    ],
  },
  {
    slug: 'fonts', title: 'Fonts', property: 'font-family',
    note: 'Two self-hosted families. Headings use Bree Serif; everything else uses Mona Sans.',
    tokens: [
      token({ name: 'font-display', label: 'Bree Serif', value: "'Bree Serif', Georgia, serif", detail: 'Regular · 400', useFor: 'Page titles and section headings.', avoid: 'Body copy, buttons, labels or card titles.', example: '<Heading size="display">' }),
      token({ name: 'font-body', label: 'Mona Sans', value: "'Mona Sans Variable', 'Mona Sans', sans-serif", detail: 'Medium 500 / Semibold 600 / Bold 700', useFor: 'Body copy, navigation, links, buttons, dates and labels.', avoid: 'Page and section headings (use --font-display).', example: 'font-family: var(--font-body);' }),
      token({ name: 'weight-regular', label: 'Regular weight', value: '400', useFor: 'Bree Serif headings.', avoid: 'Mona Sans text; it is lighter than the design.', example: 'font-weight: var(--weight-regular);' }),
      token({ name: 'weight-medium', label: 'Medium weight', value: '500', useFor: 'Body text and opening hours.', avoid: 'Buttons and card titles (use bold).', example: 'font-weight: var(--weight-medium);' }),
      token({ name: 'weight-semibold', label: 'Semibold weight', value: '600', useFor: 'Navigation and footer links.', avoid: 'Paragraphs.', example: 'font-weight: var(--weight-semibold);' }),
      token({ name: 'weight-bold', label: 'Bold weight', value: '700', useFor: 'Buttons, card titles and badges.', avoid: 'Whole paragraphs or Bree Serif headings.', example: 'font-weight: var(--weight-bold);' }),
    ],
  },
  {
    slug: 'type-sizes', title: 'Type sizes', property: 'font-size',
    note: 'Desktop sizes from the 1920px design. base.css scales them down on phones (--fluid-*); Heading and Text pick the right one.',
    tokens: [
      token({ name: 'text-label', label: 'Label', value: '1.25rem', detail: '20px', useFor: 'Badges, dates, notices and opening hours.', avoid: 'Paragraphs people need to read.', example: '<Text size="label">' }),
      token({ name: 'text-body', label: 'Body', value: '1.5rem', detail: '24px', useFor: 'Body copy, card titles, navigation and buttons.', avoid: 'Headings.', example: '<Text>' }),
      token({ name: 'text-lead', label: 'Lead', value: '1.875rem', detail: '30px', useFor: 'A short introduction under a heading, and the wordmark.', avoid: 'More than two sentences.', example: '<Text size="lead">' }),
      token({ name: 'text-heading', label: 'Heading', value: '3.125rem', detail: '50px', useFor: 'Section headings (h2).', avoid: 'Card titles (use <Heading size="title">).', example: '<Heading size="heading">' }),
      token({ name: 'text-display', label: 'Display', value: '4.375rem', detail: '70px', useFor: 'The one main page heading (h1).', avoid: 'More than once per page.', example: '<Heading level={1} size="display">' }),
      token({ name: 'leading-tight', label: 'Tight line height', value: '1', useFor: 'Big headings, badges and the wordmark.', avoid: 'Paragraphs; lines would touch.', example: 'line-height: var(--leading-tight);' }),
      token({ name: 'leading-snug', label: 'Snug line height', value: '1.25', useFor: 'Card titles and other short bold text that can wrap.', avoid: 'Paragraphs.', example: 'line-height: var(--leading-snug);' }),
      token({ name: 'leading-relaxed', label: 'Relaxed line height', value: '1.5', useFor: 'Body copy, buttons and centered section headings.', avoid: 'Display headings.', example: 'line-height: var(--leading-relaxed);' }),
    ],
  },
  {
    slug: 'spacing', title: 'Spacing', property: 'margin',
    note: 'Five steps, nothing in between. Components apply them; pages choose a step only through a gap prop (xs, sm, md, lg, xl).',
    tokens: [
      token({ name: 'space-xs', label: 'XS', value: '0.625rem', detail: '10px', useFor: 'Icon + label, buttons side by side, badge padding.', avoid: 'Space between unrelated groups.', example: '<Stack direction="row" gap="xs">' }),
      token({ name: 'space-sm', label: 'SM', value: '1.25rem', detail: '20px', useFor: 'Card title + description, button padding, footer link lists.', avoid: 'Space between page sections.', example: '<Stack gap="sm">' }),
      token({ name: 'space-md', label: 'MD', value: '1.875rem', detail: '30px', useFor: 'Card gutters, heading + text + actions stacks.', avoid: 'Tight icon + label pairs.', example: '<Grid columns={3} gap="md">' }),
      token({ name: 'space-lg', label: 'LG', value: '3.75rem', detail: '60px', useFor: 'Between big groups inside a section; page edges on tablets.', avoid: 'Inside cards or buttons.', example: '<Stack gap="lg">' }),
      token({ name: 'space-xl', label: 'XL', value: '6.25rem', detail: '100px', useFor: 'Section rhythm and page edges on wide screens.', avoid: 'Anything inside a section; it splits content apart.', example: 'padding-block: var(--space-xl);' }),
    ],
  },
  {
    slug: 'layout', title: 'Layout', property: 'max-width',
    note: 'Widths cap content. The three responsive spacing aliases step between the 5 spacing values at fixed breakpoints; they never produce other values.',
    tokens: [
      token({ name: 'width-content', label: 'Content width', value: '95rem', detail: '1520px', useFor: 'Max width of section content (card grids). At 1920px this leaves the design’s 200px margins.', avoid: 'Text columns (use --width-copy).', example: '<Section width="content">' }),
      token({ name: 'width-wide', label: 'Wide width', value: '82.5rem', detail: '1320px', useFor: 'The Find us map (MapCard caps itself at this width).', avoid: 'Text or card grids.', example: 'max-width: var(--width-wide);' }),
      token({ name: 'width-article', label: 'Article width', value: '70rem', detail: '1120px', useFor: 'A news list or an event’s text and buttons (Figma Events & News, Event View): PostList, Section width="article".', avoid: 'Long text on its own (use --width-text) or card grids.', example: '<Section width="article">' }),
      token({ name: 'width-copy', label: 'Copy width', value: '38.875rem', detail: '622px', useFor: 'Readable text columns: hero copy, newsletter, split sections.', avoid: 'Card grids.', example: '<Section width="copy">' }),
      token({ name: 'width-text', label: 'Text width', value: '57.5rem', detail: '920px', useFor: 'Long reading on its own: FAQs, articles, the About story (Section width="text", Prose).', avoid: 'Text beside a photo (use --width-copy) or card grids.', example: '<Section width="text">' }),
      token({ name: 'page-inset', label: 'Page inset', value: 'var(--space-sm)', detail: '20 → 60 → 100px', useFor: 'Left and right space at the page edge. Section, Split, header and footer apply it.', avoid: 'Spacing inside content; pages never need it directly.', example: 'padding-inline: var(--page-inset);', steps: [{ minWidth: '48rem', value: 'var(--space-lg)' }, { minWidth: '100rem', value: 'var(--space-xl)' }] }),
      token({ name: 'section-space', label: 'Section space', value: 'var(--space-lg)', detail: '60 → 100px', useFor: 'Space above and below each page section. Section and Split apply it.', avoid: 'Gaps inside a section (use --section-gap).', example: 'padding-block: var(--section-space);', steps: [{ minWidth: '100rem', value: 'var(--space-xl)' }] }),
      token({ name: 'section-gap', label: 'Section gap', value: 'var(--space-lg)', detail: '60 → 30 → 60px', useFor: 'Space between a section’s heading, content and action. Section applies it by default. Phones get the large step: their cards stack (60px apart), so a heading or button closer than that reads as part of the nearest card.', avoid: 'Space inside cards or between buttons.', example: 'gap: var(--section-gap);', steps: [{ minWidth: '48rem', value: 'var(--space-md)' }, { minWidth: '100rem', value: 'var(--space-lg)' }] }),
    ],
  },
  {
    slug: 'corners', title: 'Corners', property: 'border-radius',
    note: 'Three shapes only.',
    tokens: [
      token({ name: 'radius-none', label: 'Square', value: '0px', useFor: 'Sections, strips and edges where a photo bleeds off the page.', avoid: 'Photos inside the page (use --radius-image).', example: 'border-radius: var(--radius-none);' }),
      token({ name: 'radius-image', label: 'Soft', value: '2.1875rem', detail: '35px', useFor: 'Photos, image containers and floating panels.', avoid: 'Buttons and badges (use --radius-pill).', example: 'border-radius: var(--radius-image);' }),
      token({ name: 'radius-pill', label: 'Pill', value: '6.25rem', detail: '100px', useFor: 'Buttons, badges and contact strips.', avoid: 'Photos or large panels.', example: '<Button> / <Badge>' }),
    ],
  },
  {
    slug: 'borders', title: 'Borders', property: 'border-width',
    note: 'Use with a solid style and a color token. The underline tokens set how thick link underlines are and how far below the text they sit.',
    tokens: [
      token({ name: 'border-thin', label: 'Thin', value: '1px', useFor: 'Outlined buttons, badges and photo edges.', avoid: 'Focus outlines (base.css handles focus).', example: 'border: var(--border-thin) solid var(--color-border);' }),
      token({ name: 'border-strong', label: 'Strong', value: '2px', useFor: 'Filled buttons, so they match outlined ones in size.', avoid: 'Decorative frames.', example: 'border: var(--border-strong) solid var(--color-primary);' }),
      token({ name: 'underline-thickness', label: 'Underline', value: '0.12em', detail: 'about 3px on body text', useFor: 'Every underlined link. base.css sets it on all links; switch underlines on with text-decoration-line: underline (the text-decoration shorthand resets it).', avoid: 'Borders, dividers or focus outlines (use --border-thin / base.css).', example: 'text-decoration-thickness: var(--underline-thickness);' }),
      token({ name: 'underline-offset', label: 'Underline gap', value: '0.25em', useFor: 'Space between a link’s text and its underline, so the thicker line clears letters like g and y.', avoid: 'Spacing between elements (use the spacing steps).', example: 'text-underline-offset: var(--underline-offset);' }),
    ],
  },
  {
    slug: 'motion', title: 'Motion', property: 'transition-duration',
    note: 'CSS speeds for hover and press feedback. Entrances and sliding (sections rising in, FAQ answers) use Motion springs in src/scripts/motion.ts through data-motion; see docs/design-rules.md, Motion. Nothing loops or waits, and everything is off for visitors who ask for reduced motion.',
    tokens: [
      token({ name: 'motion-quick', label: 'Quick', value: '150ms', useFor: 'Hover and press feedback: button colors, arrows nudging, a button pressing in.', avoid: 'Anything that opens or moves into place (use --motion-smooth).', example: 'transition: background-color var(--motion-quick) var(--ease-out);' }),
      token({ name: 'motion-smooth', label: 'Smooth', value: '300ms', useFor: 'CSS changes that move a little further: the icon turning in the phone menu button, a card photo zooming, the FAQ + turning into ×.', avoid: 'Hover colors; they feel sluggish (use --motion-quick).', example: 'transition: transform var(--motion-smooth) var(--ease-out);' }),
      token({ name: 'motion-entrance', label: 'Entrance', value: '600ms', useFor: 'A slower CSS change the visitor watches happen once.', avoid: 'Entrances (use data-motion, src/scripts/motion.ts) or anything the visitor clicked; they would wait for it.', example: 'animation: rise var(--motion-entrance) var(--ease-out) both;' }),
      token({ name: 'ease-out', label: 'Ease out', value: 'cubic-bezier(0.22, 1, 0.36, 1)', useFor: 'Every transition and animation: starts quickly, settles gently.', avoid: 'Linear or bouncy curves; they read as mechanical or playful.', example: 'transition-timing-function: var(--ease-out);' }),
    ],
  },
];

/** Every spacing custom property a component may use in margin, padding, gap or inset. */
export const spacingTokenNames = tokenGroups.flatMap(group => group.tokens)
  .filter(t => t.name.startsWith('--space-') || t.steps)
  .map(t => t.name);

const allTokens = tokenGroups.flatMap(group => group.tokens);
const stepWidths = [...new Set(allTokens.flatMap(t => t.steps?.map(step => step.minWidth) ?? []))]
  .sort((a, b) => parseFloat(a) - parseFloat(b));

export const tokensCSS = `/* Cottonwood new-site tokens. Generated from src/design-system/tokens.ts. */\n:root {\n${tokenGroups.map(group => `  /* ${group.title} */\n${group.tokens.map(t => `  ${t.name}: ${t.value};`).join('\n')}`).join('\n\n')}\n}\n${stepWidths.map(width => `@media (min-width: ${width}) {\n  :root {\n${allTokens.filter(t => t.steps?.some(step => step.minWidth === width)).map(t => `    ${t.name}: ${t.steps!.find(step => step.minWidth === width)!.value};`).join('\n')}\n  }\n}\n`).join('')}`;
