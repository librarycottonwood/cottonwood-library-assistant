/** Keep Givebutter's transient iframe measurements from resizing the whole photo-and-form row. */
export function stabilizeFundraiserFrames() {
  if (!('ResizeObserver' in window)) return;
  for (const slot of document.querySelectorAll<HTMLElement>('.fundraiser-slot')) {
    const widget = slot.querySelector<HTMLElement>('givebutter-widget');
    if (!widget || slot.hasAttribute('data-embed-sizing')) continue;
    let height = Math.round(widget.getBoundingClientRect().height);
    if (!height) continue;
    // Keep the existing first-step reservation. The widget remains visible and unclipped;
    // only its surrounding space waits for the iframe's resize burst to settle.
    slot.style.height = `${height}px`;
    slot.dataset.embedSizing = '';
    let pending: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        const next = Math.round(widget.getBoundingClientRect().height);
        if (next > 0 && next !== height) {
          height = next;
          slot.style.height = `${height}px`;
        }
      }, 100);
    });
    observer.observe(widget);
  }
}
