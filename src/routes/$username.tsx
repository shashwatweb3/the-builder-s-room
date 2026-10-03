import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { KrewProfileView } from "@/components/krew-profile/KrewProfileView";
import {
  PUBLIC_PROFILE_COLUMNS,
  isReservedUsername,
  profilePathLabel,
  validateUsername,
  type PublicKrewProfile,
} from "@/lib/krew-profile";

/**
 * Public Krew ID route: /shashwat
 *
 * TanStack Router ranks static routes above dynamic ones, so /events,
 * /profile, /admin and friends can never be shadowed by a username. The
 * reserved-list check below is a second, explicit guard.
 */

function createAnonClient(request: Request) {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        const header = request.headers.get("cookie") ?? "";
        return header.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name: name ?? "", value: rest.join("=") };
        });
      },
      setAll() {},
    },
  });
}

const getPublicProfile = createServerFn({ method: "GET" })
  .validator((username: string) => username)
  .handler(async ({ data: username }): Promise<PublicKrewProfile | null> => {
    const request = getRequest();
    if (!request) return null;

    // Never resolve a username that collides with an application route.
    if (isReservedUsername(username)) return null;

    const supabase = createAnonClient(request);
    if (!supabase) return null;

    // Reads go through krew_profiles_public, a DEFINER view whose visibility
    // filter is baked in and whose projection excludes user_id / status /
    // is_public / timestamps. The anon role has no grant on the base table, so
    // those columns are unreachable over REST regardless of what is requested.
    // Pending, revoked and private profiles are invisible here by construction.
    const { data, error } = await supabase
      .from("krew_profiles_public")
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq("username", username)
      .maybeSingle();

    if (error || !data) return null;
    return data as PublicKrewProfile;
  });

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    // Reject malformed slugs before touching the database.
    const check = validateUsername(params.username);
    if (!check.ok) throw notFound();

    const profile = await getPublicProfile({ data: check.username });
    if (!profile) throw notFound();

    return { profile };
  },
  head: ({ loaderData, params }) => {
    const profile = loaderData?.profile;
    if (!profile) {
      return {
        meta: [{ title: "Not found | Krew3" }, { name: "robots", content: "noindex, nofollow" }],
      };
    }

    const title = `${profile.display_name} | Krew3`;
    const description =
      profile.bio?.trim() ||
      `${profile.display_name} is a Krew3 member. Find them at ${profilePathLabel(profile.username)}.`;
    const url = `https://krew3.site/${profile.username}`;

    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 300) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 300) },
        { property: "og:type", content: "profile" },
        { property: "og:site_name", content: "Krew3" },
        { property: "og:url", content: url },
        ...(profile.avatar_url ? [{ property: "og:image", content: profile.avatar_url }] : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:site", content: "@Krew3HQ" },
      ],
      links: profile.avatar_url ? [{ rel: "canonical", href: url }] : [],
    };
  },
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const { profile } = Route.useLoaderData();

  return (
    <div className="grid-paper px-4 py-12 sm:px-6 sm:py-16">
      <KrewProfileView profile={profile} />
    </div>
  );
}
