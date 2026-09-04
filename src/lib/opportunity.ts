/**
 * Opportunity CTA / display helpers shared across the opportunities routes.
 */

/**
 * Some opportunities carry an `application_url` that is only the organization's
 * website, not a direct application form. For those we must not render an "Apply"
 * external link (the user would be sent to a page that cannot accept an
 * application), so we surface them with a "View Details" CTA instead.
 * Keyed by opportunity slug.
 */
const NON_APPLICATION_URL_SLUGS = new Set<string>([]);

export function isDirectApplication(
  slug: string,
  applicationUrl: string | null | undefined,
): boolean {
  return Boolean(applicationUrl) && !NON_APPLICATION_URL_SLUGS.has(slug);
}

/**
 * Canonical public origin for the production site. Used for Open Graph URLs on
 * the deployed detail pages (crawlers hit the live domain, not localhost).
 */
const SITE_ORIGIN = "https://www.krew3.site";

/** Path to an opportunity's public detail page. Keyed by slug. */
export const opportunityPath = (slug: string) => `/opportunities/${slug}`;

/** Absolute canonical URL for an opportunity detail page. */
export const opportunityPublicUrl = (slug: string) => `${SITE_ORIGIN}${opportunityPath(slug)}`;
