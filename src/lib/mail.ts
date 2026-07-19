import { PROFILE } from "@/content/portfolio";

export const MAIL_SUBJECT = "Let's build something";

/**
 * Primary path. Correct semantics, respects whatever client the visitor
 * actually uses — but does nothing at all if the OS has no default mail
 * handler registered, which is common on a fresh Windows install.
 *
 * IMPORTANT: this must be navigated to by a real anchor click. Assigning
 * `window.location.href` from inside a setTimeout loses user activation,
 * and the browser silently drops the navigation — which is exactly how
 * the Send button used to "work".
 */
export const MAILTO = `mailto:${PROFILE.email}?subject=${encodeURIComponent(MAIL_SUBJECT)}`;

/** Fallback for visitors with no mail client — webmail always works. */
export const GMAIL_COMPOSE =
  "https://mail.google.com/mail/?view=cm&fs=1" +
  `&to=${encodeURIComponent(PROFILE.email)}` +
  `&su=${encodeURIComponent(MAIL_SUBJECT)}`;
