import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { BuildersDirectory } from "@/components/builders/BuildersDirectory";
import type { PublicKrewProfile } from "@/lib/krew-profile";

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

/**
 * Public member directory: /builders
 *
 * Reads through krew_public_directory(), a SECURITY DEFINER function whose
 * approved + public filter and ten-column projection are both fixed server-side.
 * Ordering by newest happens inside the function, so the created_at it sorts on
 * never reaches the browser. Nothing private is queried here: no table select,
 * no user_id, no status, no is_public, no manage_token_hash.
 */
const getPublicDirectory = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicKrewProfile[]> => {
    const request = getRequest();
    if (!request) return [];

    const supabase = createAnonClient(request);
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("krew_public_directory", { p_limit: 200 });
    if (error || !Array.isArray(data)) return [];

    return data as PublicKrewProfile[];
  },
);

export const Route = createFileRoute("/builders/")({
  loader: async () => ({ members: await getPublicDirectory() }),
  head: () => ({
    meta: [
      { title: "Builders — Krew3" },
      {
        name: "description",
        content:
          "Meet the people building, creating, and contributing across Krew3. Find a builder by name or Krew ID.",
      },
      { property: "og:title", content: "Builders — Krew3" },
      {
        property: "og:description",
        content: "Meet the people building, creating, and contributing across Krew3.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BuildersPage,
});

function BuildersPage() {
  const { members } = Route.useLoaderData();

  return (
    <>
      <section className="border-b-2 border-border">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-9 sm:px-6 lg:px-10 lg:py-14">
          <div className="rise-in">
            <p className="label-mono flex items-center gap-2 text-muted-foreground">The Krew</p>
            <h1 className="mt-3 text-[clamp(2rem,9vw,2.75rem)] leading-[0.95] font-extrabold tracking-tight sm:mt-4 sm:text-[clamp(2.5rem,8vw,4rem)]">
              BUILDERS
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-snug text-muted-foreground sm:mt-4 sm:text-lg">
              Meet the people building, creating, and contributing across Krew3.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <BuildersDirectory members={members} />
      </section>
    </>
  );
}
