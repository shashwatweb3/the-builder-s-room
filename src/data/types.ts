/**
 * Domain models for The Rec Room.
 *
 * These types are the contract between the UI and the data layer.
 * Right now the data comes from local demo files in `src/data/*`.
 * Later they can be served from a database/API with the same shapes,
 * without touching any component.
 */

export type OpportunityCategory = "job" | "hackathon" | "residency" | "grant";

export interface Opportunity {
  id: string;
  category: OpportunityCategory;
  title: string;
  organization: string;
  summary: string;
  description: string;
  requirements: string[];
  whoItsFor: string;
  compensation?: string;
  tags: string[];
  ecosystem: string;
  skills: string[];
  location: string;
  remote: boolean;
  paid: boolean;
  deadline: string; // ISO date
  postedAt: string; // ISO date
  popularity: number;
  applyUrl: string;
}

export type AmbassadorProgramType =
  | "community"
  | "content"
  | "developer"
  | "regional";

export interface AmbassadorProgram {
  id: string;
  name: string;
  organization: string;
  summary: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  perks: string[];
  reward: string;
  type: AmbassadorProgramType;
  commitment: string;
  remote: boolean;
  paid: boolean;
  open: boolean;
  featured?: boolean;
  deadline: string;
  applyUrl: string;
}

export type BuilderRole =
  | "developer"
  | "designer"
  | "founder"
  | "researcher"
  | "writer"
  | "community"
  | "product"
  | "other";

export type BuilderStatus =
  | "building"
  | "open-to-collabs"
  | "available-for-work"
  | "open-to-opportunities";

export interface Builder {
  id: string;
  name: string;
  handle: string;
  roleLabel: string;
  role: BuilderRole;
  bio: string;
  about: string;
  skills: string[];
  location: string;
  statuses: BuilderStatus[];
  currentProject: string;
  pastProjects: { name: string; note: string }[];
  contributions: string[];
  lookingFor: string[];
  links: { label: string; url: string }[];
  stats: { projects: number; hackathons: number; collaborations: number };
  accent: string; // avatar tint token class
}

export type ProjectStatus = "building" | "live" | "experiment" | "needs-help";

export interface ProjectUpdate {
  date: string;
  text: string;
}

export interface Project {
  id: string;
  name: string;
  pitch: string;
  description: string;
  problem: string;
  building: string;
  builderIds: string[];
  category: string;
  stack: string[];
  status: ProjectStatus;
  github?: string;
  demo?: string;
  lookingFor: string[];
  updates: ProjectUpdate[];
  accent: string;
}

export type EventKind =
  | "meetup"
  | "hackathon"
  | "workshop"
  | "demo-day"
  | "community-call";

export interface RecEvent {
  id: string;
  name: string;
  kind: EventKind;
  date: string;
  time: string;
  location: string;
  online: boolean;
  organizer: string;
  summary: string;
  url: string;
}

export type SavedKind = "opportunity" | "project" | "builder";
