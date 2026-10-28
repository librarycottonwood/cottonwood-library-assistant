/** The library's own newsletter sign-up form. It posts to functions/api/newsletter.ts, which adds the
 * person to Givebutter. Both form components (SiteFooter's NewsletterForm and the old-design
 * NewsletterSignup) render these messages; the function answers with one of these statuses. */
export const NEWSLETTER_ENDPOINT = '/api/newsletter';

export const newsletterMessages = {
  subscribed: "Thanks! You're signed up for library news.",
  already: "You're already on the list. Thanks!",
  invalid: 'Please check your email address and try again.',
  // Followed by a link to email the library.
  error: "Sorry, sign-up isn't working right now.",
} as const;
export type NewsletterStatus = keyof typeof newsletterMessages;
export const newsletterStatuses = Object.keys(newsletterMessages) as NewsletterStatus[];

/** Fallback when sign-up fails: an email to the library. */
export const newsletterMailto = (email: string) => `mailto:${email}?subject=Library%20newsletter`;
