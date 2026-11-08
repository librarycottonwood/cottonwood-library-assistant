/**
 * Site motion, built on Motion (https://motion.dev, the `motion` package). Rules: docs/design-rules.md, "Motion".
 *
 * Components opt in with a data-motion attribute; pages never animate anything themselves.
 *   rise    Fades up as it scrolls into view (cards, photos).
 *   group   Each direct child rises, a beat apart (Section content, Split text, page titles). A child that has its
 *           own data-motion inside it (a grid of cards) is left to its cards.
 *   settle  A photo eases out of a slight zoom when the page opens. Only on a photo inside a clipping frame that owns
 *           the rounded corners (Split's opening photo, like Card's hover zoom); never hidden.
 * Blocks that arrive together are staggered top to bottom, left to right. Blocks holding a Givebutter widget are never
 * animated (an animated block becomes the containing block of its popups and traps them under the sticky header).
 * The first screen of a page arrives quicker than blocks scrolled to later, so clicking a link never feels slow.
 *
 * To animate something new, give its component one of these attributes. Need a new kind of motion? Add a preset
 * to `presets` below (and to PRESETS in scripts/motion.test.mjs); don't call animate() from a component.
 * Hover and press feedback stays in CSS with the --motion-* tokens. Scale a photo only inside a frame that owns the
 * rounded corners; scaling a photo that has its own rounded corners cuts them square while it moves.
 *
 * BaseLayout prepares entrance states before paint. If loading falls back to visible content, late entrances stay
 * disabled. A group enters as one sequence, including actions. Viewport checks and deadlines recover stalled motion.
 */
import { animate, inView } from 'motion';

/** Springs: visualDuration is how long it looks like it takes; bounce 0 settles without overshoot. */
export const springs = {
  /** Things arriving: a calm settle. */
  enter: { type: 'spring', visualDuration: 0.6, bounce: 0 },
  /** Things opening or closing under the visitor's hand (FAQ answers): quicker, still no bounce. */
  open: { type: 'spring', visualDuration: 0.35, bounce: 0 },
} as const;

/**
 * Animate only opacity and a full `transform` string: Motion hands those to the browser, which runs them off the main
 * thread. Motion's shorthand values (y, scale, x) are computed in JavaScript every frame and stutter while a page loads.
 */
export const presets = {
  settle: { keyframes: { transform: ['scale(1.05)', 'scale(1)'] }, transition: { type: 'spring', visualDuration: 1.2, bounce: 0 } },
  rise: { keyframes: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }, transition: { ...springs.enter, opacity: { duration: 0.5, ease: 'easeOut' } } },
  /** rise for the first screen when a page opens: shorter and closer, so the page is readable almost at once. */
  /** The phone menu opening: the panel fades in while its links rise into place a beat apart. */
  menuPanel: { keyframes: { opacity: [0, 1] }, transition: { duration: 0.2, ease: 'easeOut' } },
  menuItem: { keyframes: { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, transition: { ...springs.open, visualDuration: 0.45, opacity: { duration: 0.3, ease: 'easeOut' } } },
  /** …and closing: a quick fade, so the page is back at once. */
  menuClose: { keyframes: { opacity: [1, 0] }, transition: { duration: 0.15, ease: 'easeIn' } },
  riseOnLoad: { keyframes: { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, transition: { type: 'spring', visualDuration: 0.4, bounce: 0, opacity: { duration: 0.25, ease: 'easeOut' } } },
} as const;

/** Seconds between blocks that arrive together, and the most blocks that wait their turn. */
const STAGGER = 0.08;
const MAX_STAGGERED = 5;
const SKIP = 'givebutter-widget';

export const motionAllowed = () => document.documentElement.classList.contains('motion');

/** Slide an element's height open or shut (FAQ answers). Resolves when done; instant when motion is off. */
export async function slide(element: HTMLElement, open: boolean) {
  if (!motionAllowed()) return;
  const height = element.scrollHeight;
  await animate(element, open ? { height: [0, height], opacity: [0, 1] } : { height: [element.offsetHeight, 0], opacity: [1, 0] }, springs.open);
  element.style.removeProperty('height');
  element.style.removeProperty('opacity');
}

/**
 * Open or close the phone menu (SiteHeader): fade the panel, and on opening let each link rise a beat after the last.
 * Resolves when done, so the caller can hide the panel; instant when motion is off. Starting again (a quick second
 * tap) stops the animation still running.
 */
let menuRunning: { stop: () => void }[] = [];
export async function menu(panel: HTMLElement, open: boolean) {
  for (const running of menuRunning) running.stop();
  menuRunning = [];
  if (!motionAllowed()) return;
  const items = [...panel.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
  if (!open) {
    const closing = animate(panel, presets.menuClose.keyframes, presets.menuClose.transition);
    menuRunning = [closing];
    for (const item of items) { item.style.removeProperty('opacity'); item.style.removeProperty('transform'); }
    await closing;
    if (menuRunning[0] === closing) clear(panel);
    return;
  }
  const fading = animate(panel, presets.menuPanel.keyframes, presets.menuPanel.transition);
  const rising = items.map((item, index) => animate(item, presets.menuItem.keyframes, { ...presets.menuItem.transition, delay: 0.03 + Math.min(index, 8) * 0.04 }));
  menuRunning = [fading, ...rising];
  await Promise.all([fading, ...rising]);
  clear(panel);
  items.forEach(clear);
}

interface Entrance { trigger: HTMLElement; elements: HTMLElement[]; stopObserving?: () => void; }

function entrances(): Entrance[] {
  const found: Entrance[] = [];
  for (const element of document.querySelectorAll<HTMLElement>('[data-motion="rise"], [data-motion="group"]')) {
    const candidates = element.dataset.motion === 'rise' ? [element] : [...element.children].filter((child): child is HTMLElement =>
      child instanceof HTMLElement && child.tagName !== 'SCRIPT' && !child.matches('[data-motion]') && !child.querySelector('[data-motion]'));
    const elements = candidates.filter(child => !child.matches(SKIP) && !child.querySelector(SKIP));
    if (elements.length) found.push({ trigger: element, elements });
  }
  return found;
}

/**
 * Clear an animation's finished styles, a frame later because Motion writes its end values just after it resolves.
 * A shown block keeps no transform, so it leaves no stacking context or containing block behind.
 */
const clear = (element: HTMLElement) => requestAnimationFrame(() => {
  element.style.removeProperty('opacity');
  element.style.removeProperty('transform');
});

const runningEntrances = new Set<() => void>();

/** Clear completed, rejected or stalled animations through the same path. Nothing waits hidden indefinitely. */
function playEntrance(element: HTMLElement, preset: typeof presets.rise | typeof presets.riseOnLoad | typeof presets.settle, delay = 0) {
  if (!motionAllowed() || element.hasAttribute('data-motion-done')) { element.dataset.motionDone = ''; clear(element); return; }
  let playback: ReturnType<typeof animate> | undefined;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    element.dataset.motionDone = '';
    clearTimeout(deadline);
    runningEntrances.delete(finish);
    try { playback?.stop(); } finally { clear(element); }
  };
  const deadline = setTimeout(finish, 2000 + delay * 1000);
  runningEntrances.add(finish);
  try {
    playback = animate(element, preset.keyframes, { ...preset.transition, delay });
    playback.then(finish).catch(finish);
  } catch { finish(); }
}

let queue: HTMLElement[] = [];
let startedAt = 0;
function flush() {
  const onLoad = performance.now() - startedAt < 500;
  const preset = onLoad ? presets.riseOnLoad : presets.rise;
  const stagger = onLoad ? STAGGER / 2 : STAGGER;
  const arriving = queue.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top - rb.top || ra.left - rb.left; });
  queue = [];
  arriving.forEach((element, index) => {
    playEntrance(element, preset, Math.min(index, MAX_STAGGERED) * stagger);
  });
}

function start() {
  startedAt = performance.now();
  if (!motionAllowed()) return;
  for (const element of document.querySelectorAll<HTMLElement>('[data-motion="settle"]')) {
    playEntrance(element, presets.settle);
  }
  const waiting = new Set(entrances());
  const arrive = (entry: Entrance) => {
    if (!waiting.delete(entry)) return;
    entry.stopObserving?.();
    if (!queue.length) requestAnimationFrame(flush);
    queue.push(...entry.elements);
  };
  // Observe the whole group, so its heading, text and actions share one entrance even across the viewport edge.
  for (const entry of waiting) {
    try { entry.stopObserving = inView(entry.trigger, () => arrive(entry)); } catch { /* Viewport checks below remain available. */ }
  }
  // Initial content does not depend on an observer callback. Scroll/resize checks also cover delayed observers,
  // restored positions and Safari's changing visual viewport. Passed groups stay visible without replaying.
  const viewport = window.visualViewport;
  let checking = false;
  const checkViewport = () => {
    checking = false;
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? innerHeight);
    for (const entry of waiting) {
      const box = entry.trigger.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (box.bottom <= top) {
        waiting.delete(entry);
        entry.stopObserving?.();
        for (const element of entry.elements) element.dataset.motionDone = '';
      } else if (box.top < bottom) arrive(entry);
    }
  };
  const scheduleCheck = () => { if (!checking && waiting.size) { checking = true; requestAnimationFrame(checkViewport); } };
  checkViewport();
  addEventListener('scroll', scheduleCheck, { passive: true });
  addEventListener('resize', scheduleCheck, { passive: true });
  viewport?.addEventListener('resize', scheduleCheck, { passive: true });
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    for (const finish of runningEntrances) finish();
    scheduleCheck();
  });
  document.documentElement.dataset.motionReady = '';
}

start();
