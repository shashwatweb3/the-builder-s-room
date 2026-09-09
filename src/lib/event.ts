/**
 * Event share / canonical URL helpers, mirroring the opportunity helpers.
 */

const SITE_ORIGIN = "https://www.krew3.site";

/** Path to an event's public detail page. Keyed by slug. */
export const eventPath = (slug: string) => `/events/${slug}`;

/** Absolute canonical URL for an event detail page. */
export const eventPublicUrl = (slug: string) => `${SITE_ORIGIN}${eventPath(slug)}`;
