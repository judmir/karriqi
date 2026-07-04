/**
 * Slug → title pairs for wiki pages, kept separate from `wiki-content.ts` so
 * the app shell (nav, page titles) does not bundle the full markdown bodies.
 *
 * Must stay in sync with `REHAB_WIKI_PAGES` — enforced by
 * `__tests__/wiki-nav.test.ts`.
 */
export type RehabWikiNavItem = {
  slug: string;
  title: string;
};

export const REHAB_WIKI_NAV_ITEMS: RehabWikiNavItem[] = [
  { slug: "overview", title: "Program overview" },
  { slug: "day-0", title: "Day 0 checklist" },
  { slug: "equipment", title: "Equipment" },
  { slug: "hausarzt", title: "Hausarzt / clinical" },
  { slug: "supplements", title: "Supplements" },
  { slug: "meditation", title: "Meditation plan" },
  { slug: "stoicism", title: "Stoicism" },
  { slug: "weekly-structure", title: "Weekly structure" },
  { slug: "gym-workouts", title: "Gym workouts" },
  { slug: "run-walk", title: "Run / walk" },
  { slug: "hand-ot", title: "Hand / OT" },
  { slug: "speech", title: "Speech / saliva" },
  { slug: "football", title: "Football / coordination" },
  { slug: "weekly-review", title: "Weekly review" },
  { slug: "week-12-clinical", title: "Week 12 clinical" },
  { slug: "adjustment-rules", title: "Adjustment rules" },
];
