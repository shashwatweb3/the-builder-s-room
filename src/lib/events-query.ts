import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import type { RecEvent } from "@/data/types";

/**
 * Read-only fetch of published events, shared by planner views.
 * Mirrors the directory query so both pages always agree on the source of truth.
 */

export type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string | null;
  date_label: string | null;
  end_date: string | null;
  location: string;
  is_online: boolean;
  meeting_url: string | null;
  registration_url: string | null;
  organizer: string | null;
  start_time: string | null;
  end_time: string | null;
  region: string | null;
  category: string | null;
};

export function mapEventRow(row: EventRow): RecEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    kind: "meetup",
    date: row.event_date ? (row.event_date.split("T")[0] ?? row.event_date) : null,
    dateLabel: row.date_label ?? null,
    time: "",
    startTime: row.start_time,
    endTime: row.end_time,
    endDate: row.end_date ? (row.end_date.split("T")[0] ?? row.end_date) : null,
    location: row.location,
    online: row.is_online,
    organizer: row.organizer ?? "",
    summary: row.description,
    url: row.registration_url || row.meeting_url || "",
    region: row.region ?? "",
    category: row.category ?? "",
  };
}

export const getPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return [] as RecEvent[];
  }
  const request = getRequest();
  const supabase = createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const h = request?.headers.get("cookie") ?? "";
          return h.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );

  const { data, error } = await supabase
    .from("events")
    .select(
      "id,title,slug,description,event_date,date_label,end_date,location,is_online,meeting_url,registration_url,organizer,start_time,end_time,region,category",
    )
    .eq("status", "published")
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch events:", error);
    return [] as RecEvent[];
  }

  return ((data ?? []) as EventRow[]).map(mapEventRow);
});
