import { Search, X } from "lucide-react";
import { FilterBar, TogglePill } from "./FilterBar";
import { OffsetCard } from "./OffsetCard";
import { ecosystems, allSkills, allLocations } from "@/data/opportunities";

export interface OpportunityFilterState {
  q: string;
  category: string;
  remote: boolean;
  paid: boolean;
  closingSoon: boolean;
  location: string;
  ecosystem: string;
  skill: string;
  sort: "newest" | "deadline" | "popular";
}

export const defaultFilters: OpportunityFilterState = {
  q: "",
  category: "all",
  remote: false,
  paid: false,
  closingSoon: false,
  location: "any",
  ecosystem: "any",
  skill: "any",
  sort: "newest",
};

const selectClass =
  "min-h-11 w-full rounded-full border-2 border-border bg-card px-4 font-mono text-xs tracking-widest uppercase shadow-offset-sm outline-none";

export function OpportunityFilters({
  state,
  onChange,
  resultCount,
}: {
  state: OpportunityFilterState;
  onChange: (next: OpportunityFilterState) => void;
  resultCount: number;
}) {
  const set = <K extends keyof OpportunityFilterState>(key: K, value: OpportunityFilterState[K]) =>
    onChange({ ...state, [key]: value });

  const dirty = JSON.stringify(state) !== JSON.stringify(defaultFilters);

  return (
    <OffsetCard className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <label htmlFor="opp-search" className="sr-only">
            Search opportunities
          </label>
          <input
            id="opp-search"
            type="search"
            value={state.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Search roles, orgs, tags…"
            className="min-h-11 w-full rounded-full border-2 border-border bg-background pr-4 pl-11 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="opp-sort" className="sr-only">
            Sort opportunities
          </label>
          <select
            id="opp-sort"
            value={state.sort}
            onChange={(e) => set("sort", e.target.value as OpportunityFilterState["sort"])}
            className={selectClass}
          >
            <option value="newest">Sort: Newest</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="popular">Sort: Popular</option>
          </select>
        </div>
      </div>

      <FilterBar
        ariaLabel="Filter by category"
        value={state.category}
        onChange={(v) => set("category", v)}
        options={[
          { value: "all", label: "All" },
          { value: "job", label: "Jobs" },
          { value: "hackathon", label: "Hackathons" },
          { value: "residency", label: "Residencies" },
          { value: "grant", label: "Grants" },
          { value: "ambassador", label: "Ambassador Programs" },
        ]}
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <TogglePill active={state.remote} onClick={() => set("remote", !state.remote)}>
          Remote
        </TogglePill>
        <TogglePill active={state.paid} onClick={() => set("paid", !state.paid)}>
          Paid
        </TogglePill>
        <TogglePill
          active={state.closingSoon}
          onClick={() => set("closingSoon", !state.closingSoon)}
        >
          Closing soon
        </TogglePill>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="f-loc" className="sr-only">
            Location
          </label>
          <select
            id="f-loc"
            value={state.location}
            onChange={(e) => set("location", e.target.value)}
            className={selectClass}
          >
            <option value="any">Location: Any</option>
            {allLocations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-eco" className="sr-only">
            Ecosystem
          </label>
          <select
            id="f-eco"
            value={state.ecosystem}
            onChange={(e) => set("ecosystem", e.target.value)}
            className={selectClass}
          >
            <option value="any">Ecosystem: Any</option>
            {ecosystems.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-skill" className="sr-only">
            Skill
          </label>
          <select
            id="f-skill"
            value={state.skill}
            onChange={(e) => set("skill", e.target.value)}
            className={selectClass}
          >
            <option value="any">Skill: Any</option>
            {allSkills.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
        <p className="label-mono text-muted-foreground" aria-live="polite">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
        {dirty && (
          <button
            type="button"
            onClick={() => onChange(defaultFilters)}
            className="label-mono press inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 shadow-offset-sm"
          >
            <X className="size-3.5" aria-hidden /> Clear filters
          </button>
        )}
      </div>
    </OffsetCard>
  );
}
