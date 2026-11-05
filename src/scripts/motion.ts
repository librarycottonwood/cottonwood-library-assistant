/**
 * Site motion, built on Motion (https://motion.dev, the `motion` package). Rules: docs/design-rules.md, "Motion".
 *
 * Components opt in with a data-motion attribute; pages never animate anything themselves.
 *   rise    Fades up as it scrolls into view (cards, photos).
 *   group   Each direct child rises, a beat apart (Section content, Split text, page titles). A child that has its
 *           own data-motion inside it (a grid of cards) is left to its cards.
 *   settle  A photo settles from a slight zoom when the page opens (the opening photo). Never hidden.
 * Blocks that arrive together are staggered top to bottom, left to right. Fundraiser forms and embedded frames are
 * never animated (an animated block becomes their containing block and traps Givebutter's popups).
 *
 * To animate something new, give its component one of these attributes. Need a new kind of motion? Add a preset
 * to `presets` below (and to PRESETS in scripts/motion.test.mjs); don't call animate() from a component.
 * Hover and press feedback stays in CSS with the --motion-* tokens.
 *
 * Before this script runs, base.css hides rise/group blocks only when BaseLayout set html.motion (motion allowed,
 * JavaScript on). If this script never starts, BaseLayout's fallback removes html.motion and everything shows.
 */
import { animate, inView } from 'motion';

/** Springs: visualDuration is how long it looks like it takes; bounce 0 settles without overshoot. */
export const springs = {
  /** Things arriving: a calm settle. */
  enter: { type: 'spring', visualDuration: 0.6, bounce: 0 },
  /** Things opening or closing under the visitor's hand (FAQ answers): quicker, still no bounce. */
  open: { type: 'spring', visualDuration: 0.35, bounce: 0 },
} as const;

export const presets = {
  rise: { keyframes: { opacity: [0, 1], y: [24, 0] }, transition: { ...springs.enter, opacity: { duration: 0.5, ease: 'easeOut' } } },
  settle: { keyframes: { scale: [1.04, 1] }, transition: { type: 'spring', visualDuration: 1.2, bounce: 0 } },
} as const;

/** Seconds between blocks that arrive together, and the most blocks that wait their turn. */
const STAGGER = 0.08;
const MAX_STAGGERED = 5;
const SKIP = 'form, iframe, givebutter-widget';

export const motionAllowed = () => document.documentElement.classList.contains('motion');

/** Slide an element's height open or shut (FAQ answers). Resolves when done; instant when motion is off. */
export async function slide(element: HTMLElement, open: boolean) {
  if (!motionAllowed()) return;
  const height = element.scrollHeight;
  await animate(element, open ? { height: [0, height], opacity: [0, 1] } : { height: [element.offsetHeight, 0], opacity: [1, 0] }, springs.open);
  element.style.removeProperty('height');
  element.style.removeProperty('opacity');
}

function targets(): HTMLElement[] {
  const found: HTMLElement[] = [];
  for (const element of document.querySelectorAll<HTMLElement>('[data-motion="rise"], [data-motion="group"]')) {
    if (element.dataset.motion === 'rise') { found.push(element); continue; }
    for (const child of element.children) {
      if (child instanceof HTMLElement && child.tagName !== 'SCRIPT' && !child.querySelector('[data-motion]')) found.push(child);
    }
  }
  return found.filter(element => !element.matches(SKIP) && !element.querySelector(SKIP));
}

let queue: HTMLElement[] = [];
function flush() {
  const arriving = queue.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top - rb.top || ra.left - rb.left; });
  queue = [];
  arriving.forEach((element, index) => {
    element.style.opacity = '0';
    element.dataset.motionDone = '';
    const { keyframes, transition } = presets.rise;
    animate(element, keyframes, { ...transition, delay: Math.min(index, MAX_STAGGERED) * STAGGER });
  });
}

function start() {
  document.documentElement.dataset.motionReady = '';
  if (!motionAllowed()) return;
  for (const element of document.querySelectorAll<HTMLElement>('[data-motion="settle"]')) {
    const { keyframes, transition } = presets.settle;
    animate(element, keyframes, transition);
  }
  const waiting = new Set(targets());
  for (const element of waiting) {
    inView(element, () => {
      if (!waiting.delete(element)) return;
      if (!queue.length) requestAnimationFrame(flush);
      queue.push(element);
    }, { margin: '0px 0px -8% 0px' });
  }
  // A jump (a #link, a restored scroll position, a fast fling) can carry blocks past the screen without their ever
  // being seen. Show those as they are, so nothing above the visitor stays invisible.
  let checking = false;
  const showPassed = () => {
    checking = false;
    for (const element of waiting) if (element.getBoundingClientRect().bottom < 0) { waiting.delete(element); element.dataset.motionDone = ''; }
  };
  showPassed();
  addEventListener('scroll', () => { if (!checking && waiting.size) { checking = true; requestAnimationFrame(showPassed); } }, { passive: true });
}

start();
