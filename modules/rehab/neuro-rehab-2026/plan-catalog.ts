import type { RehabPlanCatalogItem, RehabPlanCatalogKind } from "@/types/rehab";

type SeedRow = {
  id: string;
  parentId: string | null;
  kind: RehabPlanCatalogKind;
  title: string;
  body?: string;
  sortOrder: number;
};

function task(
  id: string,
  parentId: string,
  title: string,
  sortOrder: number,
  body = "",
): SeedRow {
  return { id, parentId, kind: "task", title, body, sortOrder };
}

function section(
  id: string,
  parentId: string | null,
  title: string,
  sortOrder: number,
  body = "",
): SeedRow {
  return { id, parentId, kind: "section", title, body, sortOrder };
}

function guide(
  id: string,
  parentId: string,
  title: string,
  sortOrder: number,
  body: string,
): SeedRow {
  return { id, parentId, kind: "guide", title, body, sortOrder };
}

const SEED_ROWS: SeedRow[] = [
  guide(
    "guide.overview",
    "sec.root",
    "The simple goal",
    0,
    `For 12 weeks (start **Monday 8 June 2026**), do the same few things consistently:

- train left leg + whole body 3–4×/week
- train left hand 5–6×/week, short sessions
- run/walk on non-gym days
- meditate daily
- take supplements consistently if your doctor agrees
- journal 5 minutes daily
- film/test at Day 0, Week 4, Week 8, Week 12

**Success** = better function, fewer crashes, clearer triggers, better clinician conversation.

This is a rehab/tracking plan to discuss with your doctor/physio/OT/logopedics team. It is not a diagnosis or medical prescription.`,
  ),

  section("sec.day0", "sec.root", "Before You Start: Day 0 Checklist", 10),
  section("sec.day0.equipment", "sec.day0", "1) Prepare equipment", 0),
  task("task.day0.equipment.watch", "sec.day0.equipment", "Apple Watch or wearable ready", 0),
  task("task.day0.equipment.polar", "sec.day0.equipment", "Polar H10 paired, if using it", 1),
  task("task.day0.equipment.camera", "sec.day0.equipment", "Tripod/phone camera ready", 2),
  task("task.day0.equipment.journal", "sec.day0.equipment", "Journal/app ready", 3),
  task("task.day0.equipment.gym", "sec.day0.equipment", "Gym access or dumbbells/bands ready", 4),
  task("task.day0.equipment.cones", "sec.day0.equipment", "Cones/markers or football wall-passing spot ready", 5),
  task("task.day0.equipment.waking-up", "sec.day0.equipment", "Waking Up app ready", 6),
  task(
    "task.day0.equipment.supplements",
    "sec.day0.equipment",
    "Supplements bought and doses agreed with doctor/pharmacist",
    7,
  ),

  section("sec.day0.videos", "sec.day0", "2) Day 0 videos / functional baseline", 1,
    "Film in the same place, same camera angle, same order. Save as `YYYY-MM-DD_week0_task.mp4`."),
  task("task.day0.videos.typing", "sec.day0.videos", "60 sec typing sample", 0),
  task("task.day0.videos.buttons", "sec.day0.videos", "5 buttons/unbuttons", 1),
  task("task.day0.videos.shoelace", "sec.day0.videos", "Shoelace tie/untie", 2),
  task("task.day0.videos.bottle", "sec.day0.videos", "Bottle cap open/close 5×", 3),
  task("task.day0.videos.coins", "sec.day0.videos", "Coin pickup/transfer 10 coins", 4),
  task("task.day0.videos.stairs", "sec.day0.videos", "Stair descent one flight, safe railing nearby", 5),
  task("task.day0.videos.single-leg", "sec.day0.videos", "30 sec single-leg stance each side", 6),
  task("task.day0.videos.sit-stand", "sec.day0.videos", "5 sit-to-stand reps", 7),
  task("task.day0.videos.heel-raises", "sec.day0.videos", "10 heel raises each side", 8),
  task("task.day0.videos.walk", "sec.day0.videos", "6-minute walk or fixed route walk", 9),
  task("task.day0.videos.wall-passes", "sec.day0.videos", "60 sec football wall passes", 10),
  task("task.day0.videos.cone-dribble", "sec.day0.videos", "Slow cone dribble or ball-control sample", 11),
  task("task.day0.videos.reading-speech", "sec.day0.videos", "1 min reading speech sample", 12),
  task("task.day0.videos.spontaneous-speech", "sec.day0.videos", "1 min spontaneous speech sample", 13),

  section("sec.day0.clinical", "sec.day0", "3) Day 0 clinical checks (GP/Hausarzt)", 2,
    "Purpose: baseline + follow-up of previous abnormalities, not broad rare-disease searching."),
  task("task.day0.clinical.cbc", "sec.day0.clinical", "CBC / großes Blutbild", 0),
  task("task.day0.clinical.electrolytes", "sec.day0.clinical", "Sodium, potassium, calcium, magnesium", 1),
  task("task.day0.clinical.kidney", "sec.day0.clinical", "Creatinine, eGFR, urea", 2),
  task("task.day0.clinical.liver", "sec.day0.clinical", "ALT/GPT, AST/GOT, GGT, bilirubin", 3),
  task("task.day0.clinical.glucose", "sec.day0.clinical", "Fasting glucose, HbA1c", 4),
  task("task.day0.clinical.crp", "sec.day0.clinical", "CRP or hs-CRP", 5),
  task("task.day0.clinical.ck", "sec.day0.clinical", "CK (especially if training/creatine starts)", 6),
  task("task.day0.clinical.thyroid", "sec.day0.clinical", "TSH, FT4, FT3", 7),
  task("task.day0.clinical.thyroid-ab", "sec.day0.clinical", "Thyroid antibodies: TPO-Ab, Tg-Ab, TRAb", 8),
  task(
    "task.day0.clinical.iron",
    "sec.day0.clinical",
    "Fasting morning iron, ferritin, transferrin, transferrin saturation (with CRP same day)",
    9,
  ),
  task("task.day0.clinical.uric", "sec.day0.clinical", "Uric acid", 10),
  task("task.day0.clinical.vitd", "sec.day0.clinical", "Vitamin D", 11),
  task(
    "task.day0.clinical.lipids",
    "sec.day0.clinical",
    "Lipids if doctor agrees: LDL, HDL, triglycerides, ApoB, Lp(a)",
    12,
  ),
  task(
    "task.day0.clinical.physio",
    "sec.day0.clinical",
    "Physio referral: left-leg coordination, eccentric knee control, dynamic stability, football progression",
    13,
  ),
  task(
    "task.day0.clinical.ot",
    "sec.day0.clinical",
    "OT referral: left-hand dexterity, bimanual tasks, typing, buttons/shoelaces/bottle caps",
    14,
  ),
  task(
    "task.day0.clinical.logopedics",
    "sec.day0.clinical",
    "Logopedics/phoniatrics: fluctuating speech, saliva/swallow/voice coordination",
    15,
  ),
  task(
    "task.day0.clinical.neuro-emg",
    "sec.day0.clinical",
    "Neurology: tremor polygraphy/surface EMG + accelerometry for situational vibration/shaking",
    16,
  ),
  task(
    "task.day0.clinical.neuro-mri",
    "sec.day0.clinical",
    "Neurology/radiology: whether 2024 MRI quality/sequences are enough or second read/3T only if specific question",
    17,
  ),

  section("sec.daily", "sec.root", "Daily Non-Negotiables", 20),
  section("sec.daily.morning", "sec.daily", "Every morning", 0),
  task("task.daily.morning.vitd", "sec.daily.morning", "Vitamin D with breakfast, if agreed with doctor", 0),
  task("task.daily.morning.protein", "sec.daily.morning", "Protein at breakfast: eggs/yogurt/whey/other protein source", 1),
  task("task.daily.morning.meditation", "sec.daily.morning", "5–10 min Waking Up meditation", 2),
  task("task.daily.morning.choose", "sec.daily.morning", "Choose today’s rehab task", 3),

  section("sec.daily.midday", "sec.daily", "Midday", 1),
  task("task.daily.midday.omega", "sec.daily.midday", "Omega-3 with lunch, if taking it", 0),
  task("task.daily.midday.posture", "sec.daily.midday", "2 min posture/breath reset", 1),

  section("sec.daily.workout", "sec.daily", "Workout days", 2),
  task("task.daily.workout.creatine", "sec.daily.workout", "Creatine with meal or around workout, if agreed", 0),
  task("task.daily.workout.gym", "sec.daily.workout", "Gym workout or structured strength/coordination session", 1),
  task("task.daily.workout.hand", "sec.daily.workout", "5–10 min left-hand task", 2),

  section("sec.daily.non-gym", "sec.daily", "Non-gym days", 3),
  task("task.daily.non-gym.run", "sec.daily.non-gym", "Run/walk progression or easy walk", 0),
  task("task.daily.non-gym.hand", "sec.daily.non-gym", "10–20 min left-hand task", 1),
  task("task.daily.non-gym.football", "sec.daily.non-gym", "Optional football ball-control drill", 2),

  section("sec.daily.evening", "sec.daily", "Evening", 4),
  task("task.daily.evening.magnesium", "sec.daily.evening", "Magnesium at night, if taking it and tolerated", 0),
  task("task.daily.evening.journal", "sec.daily.evening", "5 min journal", 1),
  task("task.daily.evening.wind-down", "sec.daily.evening", "Sleep wind-down, no hard late training", 2),

  guide(
    "guide.daily.journal",
    "sec.daily",
    "Daily journal — keep it short",
    5,
    `Rate 0–10:

- Sleep quality
- Stress
- Fatigue
- Left hand difficulty
- Left leg heaviness/coordination
- Speech difficulty
- Saliva/swallow difficulty
- Stairs difficulty
- Typing difficulty
- Rehab done: yes / partial / no

**Notes:** sleep, work stress, caffeine, illness, hard training, emotional load, vibration/shaking episode`,
  ),

  section("sec.meditation", "sec.root", "Meditation Plan: Waking Up", 30,
    "Default: start simple. Do not turn meditation into another stressful project."),
  task("task.meditation.w1-4", "sec.meditation", "Weeks 1–4: Introductory Course or daily meditation, 5–10 min/day", 0),
  task("task.meditation.w5-8", "sec.meditation", "Weeks 5–8: Continue daily meditation, 10 min/day", 1),
  task("task.meditation.w5-8-theory", "sec.meditation", "Weeks 5–8: Add 1–2 short theory sessions/week if useful", 2),
  task("task.meditation.w9-12", "sec.meditation", "Weeks 9–12: Continue 10 min/day", 3),
  task(
    "task.meditation.w9-12-stress",
    "sec.meditation",
    "Weeks 9–12: Short session before difficult rehab days if stress is high",
    4,
  ),
  guide(
    "guide.meditation.defaults",
    "sec.meditation",
    "Good defaults inside Waking Up",
    5,
    `1. Introductory Course / daily meditation first.
2. If anxiety/stress is prominent: use stress/anxiety-related content.
3. If sleep is poor: use sleep/rest content in the evening.`,
  ),

  section("sec.supplements", "sec.root", "Supplements — Simple Schedule", 40),
  guide(
    "guide.supplements.schedule",
    "sec.supplements",
    "Timing table",
    0,
    `Discuss with doctor/pharmacist, especially because of prior thyroid/iron findings and if using creatine.

| Time | Supplement | Simple rule |
| --- | --- | --- |
| Morning | Vitamin D | With breakfast/fat-containing meal |
| Morning | Protein | Food first; whey only if breakfast lacks protein |
| Midday | Omega-3 | With lunch |
| Workout day | Creatine | Timing not critical; with meal or around workout |
| Night | Magnesium | Evening/night if tolerated |

**Important notes:**
- Do not start/change everything on the same day if you want to know what helps or causes side effects.
- Protein does not have to be a shake every morning if breakfast already has enough protein.
- Creatine can raise creatinine interpretation; tell the doctor.
- Avoid ashwagandha for now until thyroid pattern is clarified.
- Avoid chronic high-dose B6 unless prescribed.`,
  ),

  section("sec.weekly", "sec.root", "Weekly Structure", 50,
    "Default week = 4 gym/strength days + 2 run/walk days + 1 lighter recovery day. If tired: use 3 gym days, not 4. Consistency beats intensity."),
  guide(
    "guide.weekly.calendar",
    "sec.weekly",
    "Weekly calendar template",
    0,
    `| Day | Main task | Extra tasks |
| --- | --- | --- |
| Monday | Gym A — lower body + left leg control | hand 10 min, meditation, journal |
| Tuesday | Run/walk + speech | hand 20 min, meditation, journal |
| Wednesday | Gym B — upper body + core + coordination | hand 10 min, meditation, journal |
| Thursday | Run/walk + football ball-control | speech 10 min, meditation, journal |
| Friday | Gym C — lower body + dynamic stability | hand 10 min, meditation, journal |
| Saturday | Gym D or football/coordination day | longer walk optional, meditation, journal |
| Sunday | Recovery + weekly review | light mobility, week review, plan next week |`,
  ),

  section("sec.gym", "sec.root", "What To Do In The Gym", 60,
    "Keep sessions 45–60 min. Stop before you are destroyed."),
  guide(
    "guide.gym.a",
    "sec.gym",
    "Gym A — Lower body + left leg control",
    0,
    `- Warm-up: 5–10 min bike/walk + mobility
- Sit-to-stand or goblet squat: 3 sets
- Supported split squat: 3 sets each side
- Step-ups: 3 sets each side
- Slow step-downs: 2–3 sets each side
- Heel raises: 2–3 sets
- Balance: single-leg stance with support, 2–3 rounds
- Cool-down: easy walk + breathing`,
  ),
  guide(
    "guide.gym.b",
    "sec.gym",
    "Gym B — Upper body + core + coordination",
    1,
    `- Warm-up: 5–10 min
- Row: 3 sets
- Chest press or push-up variation: 3 sets
- Lat pulldown: 3 sets
- Shoulder press light/moderate: 2–3 sets
- Farmer carry or suitcase carry: 3 rounds
- Core anti-rotation / Pallof press: 2–3 sets
- Left-hand dexterity finisher: 5–10 min`,
  ),
  guide(
    "guide.gym.c",
    "sec.gym",
    "Gym C — Lower body + dynamic stability",
    2,
    `- Warm-up: 5–10 min
- Romanian deadlift pattern: 3 sets
- Leg press or squat pattern: 3 sets
- Lateral step-down or lateral lunge: 2–3 sets
- Eccentric knee-control drill: 2–3 sets
- Direction-change walking drills: 5–10 min
- Optional mini hops only after Week 5 and only if safe/stable`,
  ),
  guide(
    "guide.gym.d",
    "sec.gym",
    "Gym D — Optional fourth day",
    3,
    `Choose one:
- Easy full-body strength, OR
- Football-specific coordination, OR
- Mobility + balance + left-side control

Do not make Gym D a punishment day. It is optional.`,
  ),

  section("sec.run-walk", "sec.root", "Run / Walk Progression", 70),
  guide(
    "guide.run-walk.table",
    "sec.run-walk",
    "Progression by week",
    0,
    `Only progress if the previous week did not cause a next-day crash.

| Weeks | Run/walk plan |
| --- | --- |
| 1–2 | Easy walks only, 20–45 min |
| 3–4 | 1 min jog / 2 min walk × 6 if stable |
| 5–6 | 1–2 min jog / 2 min walk × 6–8 |
| 7–8 | Slightly longer easy intervals, no speed chasing |
| 9–10 | Build toward continuous easy running if tolerated |
| 11 | Consolidate, do not add novelty |
| 12 | Easy only before final retest |

**Rule:** if symptoms flare >2 points for 24–48h, reduce the next session by 30–50%.`,
  ),

  section("sec.hand", "sec.root", "Left-Hand / OT Tasks", 80),
  guide(
    "guide.hand.tasks",
    "sec.hand",
    "Session ideas (10–20 min most days)",
    0,
    `Choose 2–3 per session:

- buttons/unbuttons
- shoelace tie/untie
- bottle cap open/close
- coin pickup/transfer
- slow typing practice
- left-hand mouse/keyboard control if useful
- guitar/piano-like finger pattern
- bimanual task: both hands together, slow and accurate

Track quality, not just speed.`,
  ),

  section("sec.speech", "sec.root", "Speech / Saliva Tasks", 90),
  guide(
    "guide.speech.tasks",
    "sec.speech",
    "2–3×/week, 10–15 min",
    0,
    `- 1 min reading aloud
- 1 min spontaneous speech
- note effort 0–10
- note saliva/swallow difficulty 0–10
- practice slower pacing and breath pauses

If saliva/swallowing feels clinically relevant, prioritize in-person logopedics/phoniatrics evaluation.`,
  ),

  section("sec.football", "sec.root", "Football / Coordination Tasks", 100),
  guide(
    "guide.football.phases",
    "sec.football",
    "1–2×/week, low-risk progression",
    0,
    `**Weeks 1–4:** ball taps, sole rolls, wall passes slow, cone dribble slow

**Weeks 5–8:** increase accuracy and rhythm; slight speed increase only if stable; no contact/competitive play

**Weeks 9–12:** controlled turns, light acceleration, passing/dribbling with friend if safe; still avoid ego-driven maximal play`,
  ),

  section("sec.phases", "sec.root", "12-Week Calendar", 110),
  guide(
    "guide.phases.w1-3",
    "sec.phases",
    "Weeks 1–3: Build the routine",
    0,
    `Focus: easy start, consistency, no crash.

- Monday: Gym A
- Tuesday: easy walk/run-walk depending on week + speech
- Wednesday: Gym B
- Thursday: easy walk + football control
- Friday: Gym C
- Saturday: optional Gym D or light football
- Sunday: recovery + weekly review`,
  ),
  guide(
    "guide.phases.w4",
    "sec.phases",
    "Week 4: Retest week",
    1,
    `- Reduce training by about 20%.
- Repeat Day 0 videos.
- Compare Week 0 vs Week 4.
- Keep only moderate workouts.`,
  ),
  guide(
    "guide.phases.w5-7",
    "sec.phases",
    "Weeks 5–7: Build phase",
    2,
    `Focus: more load, more coordination, still controlled.

- Monday: Gym A, slightly heavier if stable
- Tuesday: run/walk progression + speech
- Wednesday: Gym B
- Thursday: football control + easy walk
- Friday: Gym C
- Saturday: optional Gym D or coordination day
- Sunday: recovery + weekly review`,
  ),
  guide(
    "guide.phases.w8",
    "sec.phases",
    "Week 8: Retest week",
    3,
    `- Repeat video/function tests.
- Compare Week 0 vs Week 4 vs Week 8.
- Prepare short clinician update if appointment is coming.`,
  ),
  guide(
    "guide.phases.w9-11",
    "sec.phases",
    "Weeks 9–11: Functional integration",
    4,
    `Focus: stairs, running, football, real-life hand tasks.

- Monday: Gym A
- Tuesday: run/walk or easy run + speech
- Wednesday: Gym B
- Thursday: football coordination + hand tasks
- Friday: Gym C
- Saturday: optional Gym D / football / long walk
- Sunday: recovery + weekly review`,
  ),
  guide(
    "guide.phases.w12",
    "sec.phases",
    "Week 12: Final retest week",
    5,
    `- Keep training easy/moderate.
- Repeat full video/function protocol.
- Summarize the 12 weeks.
- Decide next cycle with clinician/physio input.`,
  ),

  section("sec.weekly-review", "sec.root", "Weekly Review — Every Sunday", 120),
  guide(
    "guide.weekly-review.form",
    "sec.weekly-review",
    "Sunday review template",
    0,
    `- Rehab adherence: __%
- Gym sessions: __ / planned __
- Run/walk sessions: __ / planned __
- Hand sessions: __ / planned __
- Meditation days: __ / 7
- Sleep average: __
- Stress average: __
- Fatigue average: __
- Left hand average: __
- Left leg average: __
- Speech average: __
- Saliva/swallow average: __
- Vibration/shaking episodes: __
- Best win this week: __
- Biggest trigger: __
- Next week adjustment: progress / hold / deload`,
  ),

  section("sec.week12-clinical", "sec.root", "Week 12 Final Clinical Checks", 130),
  section("sec.week12-clinical.tests", "sec.week12-clinical", "Repeat functional tests", 0),
  task("task.week12.tests.videos", "sec.week12-clinical.tests", "Repeat all Day 0 videos", 0),
  task("task.week12.tests.compare", "sec.week12-clinical.tests", "Compare Week 0 / 4 / 8 / 12", 1),
  task(
    "task.week12.tests.summary",
    "sec.week12-clinical.tests",
    "Make one-page summary for doctors/physio/OT/logopedics",
    2,
  ),
  section("sec.week12-clinical.labs", "sec.week12-clinical", "Ask doctor whether to repeat labs", 1),
  task("task.week12.labs.thyroid", "sec.week12-clinical.labs", "Thyroid panel if FT4/TSH issue persists", 0),
  task("task.week12.labs.iron", "sec.week12-clinical.labs", "Iron studies if transferrin saturation/ferritin issue persists", 1),
  task("task.week12.labs.kidney-ck", "sec.week12-clinical.labs", "Kidney markers + CK if using creatine/training hard", 2),
  task("task.week12.labs.uric", "sec.week12-clinical.labs", "Uric acid if previously high/borderline", 3),
  task("task.week12.labs.vitd", "sec.week12-clinical.labs", "Vitamin D if supplementing", 4),
  task("task.week12.labs.crp", "sec.week12-clinical.labs", "CRP if interpreting ferritin/iron or general inflammation", 5),
  guide(
    "guide.week12.clinician-summary",
    "sec.week12-clinical",
    "One-page clinician summary template",
    2,
    `**Patient:** Judmir Karriqi  
**Period:** Week 0 to Week 12  
**Main focus:** left hand dexterity, left leg coordination/stairs/running/football, speech/saliva, stress/fatigue pacing.

- Adherence: __%
- Improved: ____
- Unchanged: ____
- Worse: ____
- Triggers observed: ____
- Videos available: Week 0 / 4 / 8 / 12
- Labs: baseline done yes/no; key abnormalities: ____

**Questions for clinicians:**
1. Does the current pattern still fit FND/FMD best?
2. How should old left tibial SEP/P40 delay be interpreted now?
3. Is tremor polygraphy/surface EMG + accelerometry useful for situational vibration/shaking?
4. Is MRI second read enough, or repeat imaging only if a specific question appears?
5. What should the next 12-week block prioritize: leg, hand, speech, conditioning, or pacing?`,
  ),

  section("sec.adjustment", "sec.root", "Adjustment Rules", 140),
  guide(
    "guide.adjustment.rules",
    "sec.adjustment",
    "When to progress or deload",
    0,
    `**Progress only one thing/week:**
- more weight OR
- more duration OR
- more complexity OR
- more speed

**Deload if:**
- sleep worsens for 3+ nights
- symptoms flare after most sessions
- fatigue stays high
- motivation drops because the plan feels punishing
- left leg control feels unsafe

Keep the plan boring enough that you can actually do it.`,
  ),
];

/** Virtual root — children use parentId `sec.root`. */
export const REHAB_PLAN_CATALOG_ROOT_ID = "sec.root";

export const REHAB_PLAN_CATALOG: RehabPlanCatalogItem[] = [
  {
    id: "sec.root",
    parentId: null,
    kind: "section",
    title: "12-Week Neuro-Rehab Plan",
    body: "Judmir Karriqi — simplified working plan. Version: 2026-06-01.",
    sortOrder: 0,
  },
  ...SEED_ROWS.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    kind: row.kind,
    title: row.title,
    body: row.body ?? "",
    sortOrder: row.sortOrder,
  })),
];

export function rehabPlanCatalogTaskCount(): number {
  return REHAB_PLAN_CATALOG.filter((item) => item.kind === "task").length;
}
