import type { RehabClinicalCatalogItem } from "@/types/rehab";

export const REHAB_CLINICAL_ITEMS: RehabClinicalCatalogItem[] = [
  {
    id: "before.gear",
    phase: "before",
    title: "Gear ready",
    body: "Apple Watch or wearable, phone camera/tripod, and journal app ready before you measure anything.",
    sortOrder: 0,
    calendarEventKind: null,
  },
  {
    id: "before.gp",
    phase: "before",
    title: "GP visit + baseline bloodwork",
    body: "Book Hausarzt/GP for fasting morning bloodwork if your doctor agrees. Full lab list is in **Wiki → Hausarzt / clinical**.",
    sortOrder: 1,
    calendarEventKind: null,
  },
  {
    id: "before.referrals",
    phase: "before",
    title: "Referrals booked",
    body: "Physio (left leg), OT (left hand), and speech/logopedics if still relevant. One appointment booked is enough to check this off.",
    sortOrder: 2,
    calendarEventKind: null,
  },
  {
    id: "before.health-export",
    phase: "before",
    title: "Export health data snapshot",
    body: "Export Apple Health / watch data (sleep, HRV, activity, heart rate) so you can compare at the end of rehab.",
    sortOrder: 3,
    calendarEventKind: null,
  },
  {
    id: "before.videos-hands",
    phase: "before",
    title: "Baseline videos — hands & typing",
    body: "Film in the same place every time. Save as `YYYY-MM-DD_week0_task.mp4`.\n\n- 60 sec typing\n- buttons/unbuttons\n- shoelace tie/untie\n- bottle cap open/close\n- coin pickup/transfer",
    sortOrder: 4,
    calendarEventKind: "day0",
  },
  {
    id: "before.videos-legs",
    phase: "before",
    title: "Baseline videos — legs & balance",
    body: "Same camera angle as hand videos.\n\n- stair descent (one flight, railing nearby)\n- 30 sec single-leg stance each side\n- 5 sit-to-stand reps\n- 10 heel raises each side\n- 6-minute walk or fixed route walk",
    sortOrder: 5,
    calendarEventKind: "day0",
  },
  {
    id: "before.videos-speech",
    phase: "before",
    title: "Baseline videos — speech & football",
    body: "- 60 sec football wall passes\n- slow cone dribble or ball control\n- 1 min reading speech\n- 1 min spontaneous speech",
    sortOrder: 6,
    calendarEventKind: "day0",
  },

  {
    id: "after.gp",
    phase: "after",
    title: "Repeat bloodwork if needed",
    body: "Ask your doctor whether to repeat labs — especially thyroid, iron, kidney/CK, uric acid, vitamin D, or CRP if abnormal at baseline.",
    sortOrder: 0,
    calendarEventKind: null,
  },
  {
    id: "after.videos",
    phase: "after",
    title: "Repeat all Day 0 videos",
    body: "Same place, same camera angle, same order as Week 0. Save as `YYYY-MM-DD_week12_task.mp4`.",
    sortOrder: 1,
    calendarEventKind: "retest",
  },
  {
    id: "after.health-export",
    phase: "after",
    title: "Export health data again",
    body: "Export the same health metrics you saved at the start so you can compare sleep, HRV, and activity.",
    sortOrder: 2,
    calendarEventKind: null,
  },
  {
    id: "after.compare",
    phase: "after",
    title: "Compare before vs after",
    body: "Side-by-side review of Week 0 vs Week 12 videos and health exports. Note what improved, what stayed the same, and what triggers you noticed.",
    sortOrder: 3,
    calendarEventKind: "retest",
  },
  {
    id: "after.summary",
    phase: "after",
    title: "One-page clinician summary",
    body: "Short summary for GP, physio, OT, and speech: adherence, wins, unchanged areas, triggers, and questions for the next block. Template in **Wiki → Week 12 clinical**.",
    sortOrder: 4,
    calendarEventKind: null,
  },
];

export const REHAB_CLINICAL_PHASE_LABELS = {
  before: "Before rehab (Day 0)",
  after: "After rehab (Week 12)",
} as const;

export const REHAB_CLINICAL_PHASE_INTRO = {
  before:
    "Know where you start — clinical checks, measurements, videos, and a health data export so you can compare at the end.",
  after:
    "Do the same checks again at the end so you can see what changed.",
} as const;
