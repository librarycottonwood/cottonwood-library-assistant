// Progressive enhancement for the newsletter forms (NewsletterForm and NewsletterSignup).
// Without JavaScript the form posts normally and the server redirects back to
// #newsletter-<status>, which CSS (:target) shows. With it, we post JSON and show the
// same message in place; the status container is an aria-live region. Once this runs the
// form gets data-enhanced, which turns the :target rule off and data-shown on.
import { newsletterStatuses, type NewsletterStatus } from '../content/newsletter';

const isStatus = (value: unknown): value is NewsletterStatus => newsletterStatuses.includes(value as NewsletterStatus);

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-newsletter-form]')) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const messages = [...form.querySelectorAll<HTMLElement>('[data-newsletter-status]')];
  const show = (status: NewsletterStatus | null) => {
    for (const message of messages) message.toggleAttribute('data-shown', message.dataset.newsletterStatus === status);
  };
  // Keep a message from a no-JavaScript submit (#newsletter-<status>) visible.
  const arrived = location.hash.replace('#newsletter-', '');
  show(location.hash.startsWith('#newsletter-') && isStatus(arrived) ? arrived : null);
  form.dataset.enhanced = '';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    show(null);
    form.setAttribute('aria-busy', 'true');
    if (button) button.disabled = true;
    let status: NewsletterStatus = 'error';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json().catch(() => undefined);
      if (isStatus(result?.status)) status = result.status;
    } catch { /* network problem: show the error message with the email fallback */ }
    form.removeAttribute('aria-busy');
    if (button) button.disabled = false;
    show(status);
    if (status === 'subscribed' || status === 'already') form.reset();
    // Each Turnstile token works once; get a fresh one for the next try.
    (window as { turnstile?: { reset(element: Element): void } }).turnstile?.reset(form.querySelector('.cf-turnstile') ?? form);
    if (status === 'invalid') form.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
  });
}
