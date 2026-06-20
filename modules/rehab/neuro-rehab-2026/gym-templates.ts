import {
  serializeEventDescription,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";

function gifReferenceUrl(query: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
    `${query} exercise gif`,
  )}`;
}

function exerciseSubtask(
  id: string,
  label: string,
  query: string,
): EventSubtask {
  return {
    id,
    label,
    done: false,
    referenceLabel: "GIF",
    referenceUrl: gifReferenceUrl(query),
  };
}

function noteSubtask(id: string, label: string): EventSubtask {
  return { id, label, done: false };
}

function gymDescription(
  title: string,
  note: string,
  subtasks: EventSubtask[],
): string {
  return serializeEventDescription(`## ${title}\n\n${note}`, subtasks) ?? "";
}

export const GYM_A_DESCRIPTION = gymDescription(
  "Gym A — Left-leg strength + loaded control",
  "Your only strength-focused leg day of the week. RPE 6–7 in early weeks; RPE 7–8 later only if stable. No grinding, no max weight, no pushing through ugly left-leg control. Not medical prescription — discuss with physio/doctor. Keep stop/deload rules.",
  [
    exerciseSubtask(
      "gym-a-warm-up",
      "Warm-up: 8–10 min — bike/walk 5 min, hip/ankle mobility, 2 rounds bodyweight squats + heel raises + step-ups",
      "stationary bike warm up hip ankle mobility",
    ),
    exerciseSubtask(
      "gym-a-squat",
      "Goblet squat or leg press: 3 × 6–10 — equal foot pressure, slow lowering, smooth drive up",
      "goblet squat",
    ),
    exerciseSubtask(
      "gym-a-split-squat",
      "Supported split squat: 3 × 6–8 each side — left knee tracks straight, quality over depth",
      "supported split squat",
    ),
    exerciseSubtask(
      "gym-a-step-ups",
      "Step-ups: 3 × 6–8 each side — full left foot on step, push through left leg, pause at top",
      "step up exercise",
    ),
    exerciseSubtask(
      "gym-a-step-downs",
      "Slow step-downs: 2–3 × 5–8 each side — 3-sec lowering, knee aligned, light support OK",
      "slow step down exercise",
    ),
    exerciseSubtask(
      "gym-a-heel-raises",
      "Heel raises: 2–3 × 10–15 — both legs first, then supported single-leg; compare left vs right",
      "standing heel raise",
    ),
    exerciseSubtask(
      "gym-a-balance",
      "Balance / left-leg control: 2–3 rounds — single-leg stance, toe taps, weight shifts, or slow marching",
      "single leg stance balance support",
    ),
    exerciseSubtask(
      "gym-a-cool-down",
      "Cool-down: easy walk 3–5 min",
      "cool down walk breathing exercise",
    ),
    noteSubtask(
      "gym-a-log",
      "Log 0–10: left-leg control, stairs confidence, fatigue",
    ),
  ],
);

export const GYM_B_DESCRIPTION = gymDescription(
  "Gym B — Upper body + core + left-hand coordination",
  "Whole-body coordination day — not leg-heavy. RPE 5–7 in weeks 1–3. Friday already includes carries; skip or lighten Saturday carries if tired or sore from Wednesday.",
  [
    exerciseSubtask(
      "gym-b-warm-up",
      "Warm-up: 8 min — row/bike/walk, shoulder circles, wall slides, band pull-aparts, 1 min left-hand open/close/taps",
      "upper body warm up shoulder mobility",
    ),
    exerciseSubtask(
      "gym-b-row",
      "Seated row or cable row: 3 × 8–12 — equal pull left/right, calm left grip, slow return",
      "seated cable row",
    ),
    exerciseSubtask(
      "gym-b-chest-press",
      "Chest press or push-up variation: 3 × 8–12 — both arms together, no right-side dominance",
      "machine chest press push up",
    ),
    exerciseSubtask(
      "gym-b-lat-pulldown",
      "Lat pulldown: 3 × 8–12 — equal grip pressure, left arm does not lag",
      "lat pulldown",
    ),
    exerciseSubtask(
      "gym-b-shoulder-press",
      "Shoulder press: 2 × 8–10 light/moderate — alt landmine, incline DB, or machine if messy",
      "dumbbell shoulder press",
    ),
    exerciseSubtask(
      "gym-b-carry",
      "Farmer/suitcase carry (optional or lighter): 2–3 × 20–40 m — skip if tired; tall posture, left grip, no leaning",
      "farmer carry suitcase carry",
    ),
    exerciseSubtask(
      "gym-b-pallof",
      "Pallof press / anti-rotation core: 2–3 × 8–12 each side — resist rotation, stable pelvis",
      "pallof press",
    ),
    exerciseSubtask(
      "gym-b-hand",
      "Left-hand coordination finisher: 8–10 min — choose 2–3 (coin transfer, buttons, shoelace, typing, finger pattern)",
      "hand dexterity exercise",
    ),
  ],
);

export const GYM_C_DESCRIPTION = gymDescription(
  "Gym C — Dynamic stability + gait control + light power prep",
  "Movement-quality day — not a second leg strength session. Friday should make you move better, not make legs sore. If leg pain after Wednesday: no plyometrics, no deep lunges, reduce volume 30–50%. Power only Week 5+ if no pain and control stays clean.",
  [
    exerciseSubtask(
      "gym-c-warm-up",
      "Dynamic warm-up: 8–10 min — walk/bike, ankle rocks, hip mobility, slow marching, lateral steps",
      "dynamic warm up ankle hip mobility",
    ),
    exerciseSubtask(
      "gym-c-gait-rhythm",
      "Gait rhythm / start-stop control: 5 min — walk → stop → restart, slow turns, left-foot placement; no speed goal",
      "gait start stop walking drill",
    ),
    exerciseSubtask(
      "gym-c-step-down-technique",
      "Low step-down technique: 2 × 5 each side — slow, clean practice only; not fatiguing",
      "slow step down exercise",
    ),
    exerciseSubtask(
      "gym-c-lateral-shift",
      "Lateral weight shift / step control: 2–3 rounds — side steps, weight transfer, mini lateral lunge only if pain-free",
      "lateral weight shift side step",
    ),
    exerciseSubtask(
      "gym-c-balance-reach",
      "Balance + reach drills: 2–3 rounds — single-leg stance with support, toe taps forward/side/back, cone taps",
      "single leg balance reach cone tap",
    ),
    exerciseSubtask(
      "gym-c-carry",
      "Loaded carry: 3 rounds — farmer or suitcase, moderate weight, tall posture, left grip + trunk control",
      "farmer carry suitcase carry",
    ),
    exerciseSubtask(
      "gym-c-direction-change",
      "Direction-change drills: 5–10 min — figure-8 walk, cone walk, slow accel/decel, football foot placement; no sprinting",
      "direction change walking drill",
    ),
    exerciseSubtask(
      "gym-c-power-prep",
      "Power prep (Week 5+ only if no pain): mini pogo hops 2 × 10 sec OR low step quick drive 2 × 5/side — skip if sloppy",
      "mini hop plyometric drill",
    ),
    exerciseSubtask(
      "gym-c-cool-down",
      "Cool-down: easy walk 5 min",
      "cool down walk breathing exercise",
    ),
    noteSubtask(
      "gym-c-log",
      "Log 0–10: gait confidence, left-leg heaviness; tremor yes/no; next-day flare yes/no",
    ),
  ],
);

export const GYM_D_DESCRIPTION = gymDescription(
  "Gym D — Optional fourth day",
  "Choose one path. Do not make Gym D a punishment day; it is optional.",
  [
    exerciseSubtask(
      "gym-d-full-body",
      "Option 1: Easy full-body strength",
      "easy full body strength workout",
    ),
    exerciseSubtask(
      "gym-d-football",
      "Option 2: Football-specific coordination",
      "football coordination drill",
    ),
    exerciseSubtask(
      "gym-d-mobility",
      "Option 3: Mobility + balance + left-side control",
      "mobility balance exercise",
    ),
  ],
);

export const HAND_OT_DESCRIPTION = `Choose 2–3 per session (10–20 min):
- buttons/unbuttons
- shoelace tie/untie
- bottle cap open/close
- coin pickup/transfer
- slow typing practice
- left-hand mouse/keyboard control
- guitar/piano-like finger pattern
- bimanual task: both hands together, slow and accurate

Track quality, not just speed. See Wiki: Hand / OT.`;

export const SPEECH_DESCRIPTION = `10–15 min:
- 1 min reading aloud
- 1 min spontaneous speech
- Note effort 0–10
- Note saliva/swallow difficulty 0–10
- Practice slower pacing and breath pauses`;

export const FOOTBALL_WEEKS_1_4 = `Weeks 1–4 football / coordination:
- ball taps
- sole rolls
- wall passes slow
- cone dribble slow`;

export const FOOTBALL_WEEKS_5_8 = `Weeks 5–8:
- increase accuracy and rhythm
- slight speed increase only if stable
- no contact/competitive play`;

export const FOOTBALL_WEEKS_9_12 = `Weeks 9–12:
- controlled turns
- light acceleration
- passing/dribbling with friend if safe
- still avoid ego-driven maximal play`;

export function footballDescriptionForWeek(week: number): string {
  if (week <= 4) return FOOTBALL_WEEKS_1_4;
  if (week <= 8) return FOOTBALL_WEEKS_5_8;
  return FOOTBALL_WEEKS_9_12;
}

export { DAY0_DESCRIPTION } from "@/modules/rehab/neuro-rehab-2026/day0-checklist";

export const WEEKLY_REVIEW_DESCRIPTION = `Fill out once this week:
- Rehab adherence: __%
- Gym / run / hand / meditation counts
- Sleep, stress, fatigue averages
- Left hand / leg / speech / saliva averages
- Vibration episodes: __
- Best win / biggest trigger / next week: progress / hold / deload`;

export const RETEST_DESCRIPTION = `Retest week — reduce training ~20%.

Repeat Day 0 video protocol. Compare to Week 0 baseline.
Save videos as YYYY-MM-DD_weekN_task.mp4.`;
