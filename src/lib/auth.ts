import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./supabase/types";

function createSupabaseServerClient(request: Request) {
  return createServerClient<Database>(
    import.meta.env["VITE_SUPABASE_URL"]!,
    import.meta.env["VITE_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie") ?? "";
          return header.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );
}

export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) return { user: null, isAdmin: false };
  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return {
    user: { id: user.id, email: user.email ?? "" },
    isAdmin: (profile as { role?: string } | null)?.role === "admin",
  };
});
