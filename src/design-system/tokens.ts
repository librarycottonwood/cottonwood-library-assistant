/** New-site foundations, extracted from the supplied Figma design on 2026-10-21. */
export const figmaFile = 'https://www.figma.com/design/ZHygohymNhKRQyxIhQsQ2P/Untitled';

export interface Token {
  name: string;
  label: string;
  value: string;
  usage: string;
  node: string;
  detail?: string;
}

export interface TokenGroup {
  slug: string;
  title: string;
  description: string;
  property: string;
  note: string;
  tokens: Token[];
}

const token = (name: string, label: string, value: string, usage: string, node: string, detail?: string): Token =>
  ({ name: `--${name}`, label, value, usage, node, detail });

export const tokenGroups: TokenGroup[] = [
  {
    slug: 'colors', title: 'Colors', property: 'color',
    description: 'A little indigo. A little green. A familiar place to land.',
    note: 'Exact colors from the redesign. Names describe their role; no extra shades have been invented.',
    tokens: [
      token('color-primary', 'Indigo', '#4956a7', 'Primary actions and the opening-hours strip.', '1006:228'),
      token('color-primary-ink', 'Deep indigo', '#1b2040', 'Outlined actions and their labels.', '1002:73'),
      token('color-accent', 'Pale green', '#beedae', 'Supporting actions, including directions and donations.', '1012:1223'),
      token('color-accent-ink', 'Leaf green', '#3b5c30', 'Text on pale-green actions.', '1012:1225'),
      token('color-forest', 'Forest', '#152d25', 'Announcement labels and contact details.', '1012:1144'),
      token('color-background', 'Paper', '#f7f8ff', 'The main page background.', '1001:2'),
      token('color-surface', 'White', '#ffffff', 'Light surfaces and text on indigo.', '1012:623'),
      token('color-text', 'Black', '#000000', 'Headings and primary text.', '1002:54'),
      token('color-text-muted', 'Graphite', '#525252', 'Supporting text and secondary icons.', '1002:55'),
      token('color-border', 'Soft gray', '#d9d9d9', 'Subtle outlines around badges.', '1012:1143'),
      token('color-icon-muted', 'Silver', '#c1c1c1', 'The muted clock icon on the indigo strip.', '1002:51'),
    ],
  },
  {
    slug: 'fonts', title: 'Fonts', property: 'font-family',
    description: 'Friendly headings. Clear, comfortable reading.',
    note: 'Fonts are self-hosted. SF Pro appears in Figma as icon glyphs, so it is not included as a website text font.',
    tokens: [
      token('font-display', 'Bree Serif', "'Bree Serif', Georgia, serif", 'Page titles and section headings.', '1002:54', 'Regular · 400'),
      token('font-body', 'Mona Sans', "'Mona Sans Variable', 'Mona Sans', sans-serif", 'Body copy, navigation, links, actions, dates, and labels.', '1002:55', 'Medium · 500 / Semibold · 600 / Bold · 700'),
      token('weight-regular', 'Regular weight', '400', 'Bree Serif headings.', '1002:54'),
      token('weight-medium', 'Medium weight', '500', 'Body text and opening hours.', '1002:55'),
      token('weight-semibold', 'Semibold weight', '600', 'Navigation and footer links.', '1002:169'),
      token('weight-bold', 'Bold weight', '700', 'Actions, card titles, and announcements.', '1012:1225'),
    ],
  },
  {
    slug: 'type-sizes', title: 'Type sizes', property: 'font-size',
    description: 'A small type scale with a clear sense of hierarchy.',
    note: 'These are the original desktop sizes from the 1920px Figma frames. Responsive sizing can be added when we build the page layouts.',
    tokens: [
      token('text-label', 'Label', '1.25rem', 'Announcements, dates, and opening hours.', '1012:1144', '20px'),
      token('text-body', 'Body', '1.5rem', 'Body copy, card titles, navigation, and actions.', '1002:55', '24px'),
      token('text-lead', 'Lead', '1.875rem', 'Larger introductory copy and the wordmark.', '1043:2556', '30px'),
      token('text-heading', 'Heading', '3.125rem', 'Section headings.', '1002:337', '50px'),
      token('text-display', 'Display', '4.375rem', 'The main page heading.', '1002:54', '70px'),
      token('leading-tight', 'Tight line height', '1', 'Hero headings, compact labels, and wordmarks.', '1002:54'),
      token('leading-relaxed', 'Relaxed line height', '1.5', 'Body copy, actions, and section headings.', '1002:55'),
    ],
  },
  {
    slug: 'spacing', title: 'Spacing', property: 'margin',
    description: 'One shared scale for the space inside and between things.',
    note: 'Values come from repeated Figma padding and gaps. The one-off 94px gap and large distributed header gaps are layout measurements, not shared tokens.',
    tokens: [
      token('space-0', 'None', '0px', 'Flush edges and stacked text.', '1043:2553'),
      token('space-10', '10', '0.625rem', 'Icons, labels, and closely related items.', '1002:77', '10px'),
      token('space-16', '16', '1rem', 'Compact padding and small groups.', '1002:233', '16px'),
      token('space-20', '20', '1.25rem', 'Card text and related content.', '1002:343', '20px'),
      token('space-24', '24', '1.5rem', 'Action insets and footer groups.', '1002:171', '24px'),
      token('space-30', '30', '1.875rem', 'Card gutters and content stacks.', '1002:65', '30px'),
      token('space-50', '50', '3.125rem', 'Feature-panel insets.', '1043:2551', '50px'),
      token('space-60', '60', '3.75rem', 'Desktop navigation spacing.', '1002:30', '60px'),
      token('space-100', '100', '6.25rem', 'Section rhythm and outer page insets.', '1002:336', '100px'),
      token('space-200', '200', '12.5rem', 'Desktop content-section insets.', '1002:336', '200px'),
    ],
  },
  {
    slug: 'padding', title: 'Padding', property: 'padding',
    description: 'Breathing room inside actions, cards, and sections.',
    note: 'Semantic names reuse the spacing scale. Start and end values preserve the asymmetric icon-button padding in the design.',
    tokens: [
      token('padding-badge-block', 'Badge · vertical', 'var(--space-10)', 'Space above and below badge content.', '1012:1143', '10px'),
      token('padding-badge-end', 'Badge · end', 'var(--space-16)', 'Space after badge content; its start is 10px.', '1012:1143', '16px'),
      token('padding-action-block', 'Action · vertical', 'var(--space-16)', 'Space above and below action content.', '1012:1223', '16px'),
      token('padding-action-start', 'Action · start', 'var(--space-20)', 'Space before the leading action icon.', '1012:1223', '20px'),
      token('padding-action-end', 'Action · end', 'var(--space-24)', 'Space after the action label.', '1012:1223', '24px'),
      token('padding-card-inline', 'Card · horizontal', 'var(--space-30)', 'Left and right insets around card text.', '1002:343', '30px'),
      token('padding-feature', 'Feature panel', 'var(--space-50)', 'Insets inside large feature panels.', '1043:2551', '50px'),
      token('padding-section-block', 'Section · vertical', 'var(--space-100)', 'Desktop space above and below sections.', '1002:336', '100px'),
      token('padding-page-inline', 'Page · horizontal', 'var(--space-100)', 'Desktop header and outer page insets.', '1006:228', '100px'),
      token('padding-content-inline', 'Content · horizontal', 'var(--space-200)', 'Desktop insets for card-grid sections.', '1002:336', '200px'),
    ],
  },
  {
    slug: 'gaps', title: 'Gaps', property: 'gap',
    description: 'Keep related things close, and give bigger groups room.',
    note: 'Gap tokens reference the same spacing scale as padding. The examples scroll horizontally when the full gap needs more room.',
    tokens: [
      token('gap-none', 'Flush', 'var(--space-0)', 'Stacked date and heading.', '1043:2553', '0px'),
      token('gap-icon', 'Icon + label', 'var(--space-10)', 'Icons and labels, or adjacent actions.', '1002:77', '10px'),
      token('gap-compact', 'Compact group', 'var(--space-16)', 'Small groups in the footer.', '1002:233', '16px'),
      token('gap-card-copy', 'Card copy', 'var(--space-20)', 'Card titles and descriptions.', '1002:343', '20px'),
      token('gap-links', 'Link group', 'var(--space-24)', 'Groups of footer links.', '1002:171', '24px'),
      token('gap-content', 'Content stack', 'var(--space-30)', 'Hero content, cards, and columns.', '1002:65', '30px'),
      token('gap-navigation', 'Navigation', 'var(--space-60)', 'Desktop navigation links.', '1002:30', '60px'),
      token('gap-section', 'Section', 'var(--space-100)', 'Major section content groups.', '1002:336', '100px'),
    ],
  },
  {
    slug: 'corners', title: 'Corners', property: 'border-radius',
    description: 'Three shapes. A simple, consistent visual language.',
    note: 'The design uses square corners, 35px image corners, and 100px rounded actions. The values below preserve those choices.',
    tokens: [
      token('radius-none', 'Square', '0px', 'Sections and unrounded content.', '1001:2'),
      token('radius-image', 'Soft', '2.1875rem', 'Photos and service-card image containers.', '1002:340', '35px'),
      token('radius-pill', 'Pill', '6.25rem', 'Actions, badges, and contact strips.', '1012:1223', '100px'),
    ],
  },
  {
    slug: 'borders', title: 'Borders', property: 'border-width',
    description: 'Quiet outlines that give controls and labels definition.',
    note: 'Use with a solid border style and a color token. These widths come from the outlined catalog action and filled directions action.',
    tokens: [
      token('border-thin', 'Thin', '1px', 'Outlined actions and announcement badges.', '1002:73'),
      token('border-strong', 'Strong', '2px', 'Filled-action outlines.', '1012:1223'),
    ],
  },
];

export const tokensCSS = `/* Cottonwood new-site tokens. Source: ${figmaFile} */\n:root {\n${tokenGroups.map(group => `  /* ${group.title} */\n${group.tokens.map(t => `  ${t.name}: ${t.value};`).join('\n')}`).join('\n\n')}\n}\n`;

export const figmaNodeURL = (node: string) => `${figmaFile}?node-id=${node.replace(':', '-')}`;
