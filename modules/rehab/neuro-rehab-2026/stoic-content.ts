export const STOIC_INTENTION_TITLE = "Stoic intention";
export const STOIC_WEEKLY_REVIEW_TITLE = "Stoic weekly review";

/**
 * Stoicism layer of the 12-week neuro-rehab program.
 *
 * Meditation (Waking Up) trains attention; Stoicism trains character; rehab
 * trains function. The program delivers Stoicism as a small number of recurring
 * calendar events (see generate-program-events.ts):
 *   - a daily morning "Stoic intention" — one recurring master per 2-week block,
 *     so the theme/line evolves across the 12 weeks;
 *   - a weekly Sunday "Stoic review" — one recurring master for the whole block.
 */

/** A two-week thematic block. `startWeek` is 1-indexed (1, 3, 5, 7, 9, 11). */
export type StoicBlock = {
  startWeek: number;
  /** Theme headline for the block. */
  theme: string;
  /** Daily Stoic sentence to repeat each morning of the block. */
  sentence: string;
  /** One-line description of how to apply the theme in rehab. */
  focus: string;
};

export const STOIC_BLOCKS: StoicBlock[] = [
  {
    startWeek: 1,
    theme: "Control vs non-control",
    sentence: "My job is not to force symptoms away. My job is to train well today.",
    focus:
      "Separate what is up to you (showing up, the reps, sleep, notes, consistency) from what is not (daily symptom level, exact speed of recovery, other people's opinions).",
  },
  {
    startWeek: 3,
    theme: "Discipline without drama",
    sentence: "One session. Done properly. Then continue life.",
    focus:
      "Do the work without making it emotionally huge. Rehab becomes ordinary, like brushing teeth. Drop \"is this working?\" loops.",
  },
  {
    startWeek: 5,
    theme: "Amor fati — work with reality",
    sentence: "I do not need perfect conditions to act well.",
    focus:
      "Accept today's starting point without liking everything about it. Leg awkward, hand slow, gait asymmetric → train anyway. Observe frustration; do not obey it.",
  },
  {
    startWeek: 7,
    theme: "Voluntary discomfort",
    sentence: "Effort is not a threat. Effort is training.",
    focus:
      "Choose useful discomfort (strength, coordination, balance, dexterity, cardio) instead of being dominated by unwanted discomfort. Deliberate challenge, not punishment.",
  },
  {
    startWeek: 9,
    theme: "Identity shift",
    sentence: "I am someone who trains consistently despite uncertainty.",
    focus:
      "Not \"a broken person trying to become normal,\" but a person practicing courage, patience, and precision. Every exercise becomes practice, not a test.",
  },
  {
    startWeek: 11,
    theme: "Review and virtue",
    sentence: "Progress is not only what my body does. It is also how I respond.",
    focus:
      "Measure success by character + function, not only symptom removal. Did I show up, complain less, check less, function better, react better to bad days?",
  },
];

/** Weekly Stoic journaling prompts, indexed by program week (1–12). */
export const STOIC_WEEKLY_PROMPTS: Record<number, string> = {
  1: "What is actually under my control?",
  2: "Where do I waste energy resisting reality?",
  3: "What would consistency look like if I removed drama?",
  4: "What symptom-checking habits make things worse?",
  5: "How can I accept today's body without giving up on improvement?",
  6: "What discomfort is useful training, and what discomfort is a warning?",
  7: "Where can I practice courage in small ways?",
  8: "How do I behave on bad symptom days?",
  9: "Who am I becoming through this rehab process?",
  10: "What does patience look like in action?",
  11: "What has improved physically?",
  12: "What has improved in my reaction, discipline, and confidence?",
};

export const STOIC_CORE_PHRASE = "I control the training, not the timeline.";

/** A tappable check item logged with a Yes / Partial / No answer. */
export type StoicCheckItem = { id: string; label: string };

/** Daily "Stoic intention" discipline checks (universal across blocks). */
export const STOIC_DAILY_CHECKS: StoicCheckItem[] = [
  { id: "trained", label: "Showed up and trained" },
  { id: "discipline", label: "Acted with discipline — no drama" },
  { id: "controllables", label: "Focused on what I control" },
  { id: "responded", label: "Responded well to setbacks" },
];

/** Weekly "Stoic review" character + function questions. */
export const STOIC_WEEKLY_CHECKS: StoicCheckItem[] = [
  { id: "show_up", label: "Did I show up?" },
  { id: "complain_less", label: "Did I complain less?" },
  { id: "avoid_checking", label: "Did I avoid obsessive checking?" },
  { id: "stronger", label: "Did I get physically stronger / function better?" },
  { id: "bad_days", label: "Did I react better to bad days?" },
  { id: "normal_life", label: "Did I live more normally despite symptoms?" },
];

/** Pick the check set for a Stoic event by its title. */
export function stoicChecksForTitle(title: string): StoicCheckItem[] {
  return title.toLowerCase().includes("review")
    ? STOIC_WEEKLY_CHECKS
    : STOIC_DAILY_CHECKS;
}

/** Block covering a given program week (weeks 1–2 → block 1, etc.). */
export function stoicBlockForWeek(week: number): StoicBlock {
  const index = Math.min(STOIC_BLOCKS.length - 1, Math.floor((week - 1) / 2));
  return STOIC_BLOCKS[index];
}

/** Description for the daily morning "Stoic intention" event of a block. */
export function buildStoicDailyDescription(block: StoicBlock): string {
  return [
    `Theme (weeks ${block.startWeek}–${block.startWeek + 1}): ${block.theme}`,
    `Daily line: "${block.sentence}"`,
    "",
    block.focus,
    "",
    "Before rehab (60s):",
    "- What is in my control this session?",
    "- What is not in my control?",
    "- What would a disciplined version of me do now?",
    "",
    "During rehab — cues:",
    "- One rep at a time. No drama.",
    "- Precision over panic. Train the body I have today.",
    "- Effort is the win. Outcome is not fully mine; action is.",
    "",
    "After rehab (2 min) — write 3 lines:",
    "- Action: what did I do?",
    "- Reaction: how did I respond emotionally?",
    "- Lesson: one thing to improve tomorrow.",
    "",
    "Read: The Stoic Path — William B. Irvine, 3–4×/week. See Wiki: Stoicism.",
  ].join("\n");
}

/** Description for the weekly Sunday "Stoic review" event. */
export function buildStoicWeeklyDescription(): string {
  return [
    "Stoic weekly review (10 min). Measure character + function, not only symptoms:",
    "- Did I show up?",
    "- Did I complain less?",
    "- Did I avoid obsessive checking?",
    "- Did I get physically stronger / function better (walk, stairs, type)?",
    "- Did I react better to bad days?",
    "- Did I live more normally despite symptoms?",
    "",
    "Pick this week's prompt from the plan list / Wiki: Stoicism.",
    `Core phrase: "${STOIC_CORE_PHRASE}"`,
  ].join("\n");
}
