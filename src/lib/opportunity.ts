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
