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

function gymDescription(
  title: string,
  note: string,
  subtasks: EventSubtask[],
): string {
  return serializeEventDescription(`## ${title}\n\n${note}`, subtasks) ?? "";
}

export const GYM_A_DESCRIPTION = gymDescription(
  "Gym A — Lower body + left leg control",
  "Keep session 45–60 min. Stop before you are destroyed.",
  [
    exerciseSubtask(
      "gym-a-warm-up",
      "Warm-up: 5–10 min bike/walk + mobility",
      "stationary bike warm up mobility",
    ),
    exerciseSubtask(
      "gym-a-squat",
      "Sit-to-stand or goblet squat: 3 sets",
      "goblet squat",
    ),
    exerciseSubtask(
      "gym-a-split-squat",
      "Supported split squat: 3 sets each side",
      "supported split squat",
    ),
    exerciseSubtask(
      "gym-a-step-ups",
      "Step-ups: 3 sets each side",
      "step up exercise",
    ),
    exerciseSubtask(
      "gym-a-step-downs",
      "Slow step-downs: 2–3 sets each side",
      "slow step down exercise",
    ),
    exerciseSubtask(
      "gym-a-heel-raises",
      "Heel raises: 2–3 sets",
      "standing heel raise",
    ),
    exerciseSubtask(
      "gym-a-balance",
      "Balance: single-leg stance with support, 2–3 rounds",
      "single leg stance balance support",
    ),
    exerciseSubtask(
      "gym-a-cool-down",
      "Cool-down: easy walk + breathing",
      "cool down walk breathing exercise",
    ),
  ],
);

export const GYM_B_DESCRIPTION = gymDescription(
  "Gym B — Upper body + core + coordination",
  "Keep session 45–60 min. Stay controlled and leave 1–2 reps in reserve.",
  [
    exerciseSubtask("gym-b-warm-up", "Warm-up: 5–10 min", "upper body warm up"),
    exerciseSubtask("gym-b-row", "Row: 3 sets", "seated cable row"),
    exerciseSubtask(
      "gym-b-chest-press",
      "Chest press or push-up variation: 3 sets",
      "machine chest press push up",
    ),
    exerciseSubtask(
      "gym-b-lat-pulldown",
      "Lat pulldown: 3 sets",
      "lat pulldown",
    ),
    exerciseSubtask(
      "gym-b-shoulder-press",
      "Shoulder press light/moderate: 2–3 sets",
      "dumbbell shoulder press",
    ),
    exerciseSubtask(
      "gym-b-carry",
      "Farmer carry or suitcase carry: 3 rounds",
      "farmer carry suitcase carry",
    ),
    exerciseSubtask(
      "gym-b-pallof",
      "Core anti-rotation / Pallof press: 2–3 sets",
      "pallof press",
    ),
    exerciseSubtask(
      "gym-b-hand",
      "Left-hand dexterity finisher: 5–10 min",
      "hand dexterity exercise",
    ),
  ],
);

export const GYM_C_DESCRIPTION = gymDescription(
  "Gym C — Lower body + dynamic stability",
  "Keep this accurate before making it faster. Optional hops only after Week 5 and only if safe/stable.",
  [
    exerciseSubtask(
      "gym-c-warm-up",
      "Warm-up: 5–10 min",
      "lower body warm up mobility",
    ),
    exerciseSubtask(
      "gym-c-rdl",
      "Romanian deadlift pattern: 3 sets",
      "romanian deadlift",
    ),
    exerciseSubtask(
      "gym-c-leg-press",
      "Leg press or squat pattern: 3 sets",
      "leg press exercise",
    ),
    exerciseSubtask(
      "gym-c-lateral",
      "Lateral step-down or lateral lunge: 2–3 sets",
      "lateral step down lateral lunge",
    ),
    exerciseSubtask(
      "gym-c-knee-control",
      "Eccentric knee-control drill: 2–3 sets",
      "eccentric knee control exercise",
    ),
    exerciseSubtask(
      "gym-c-direction-change",
      "Direction-change walking drills: 5–10 min",
      "direction change walking drill",
    ),
    exerciseSubtask(
      "gym-c-mini-hops",
      "Optional mini hops after Week 5 only if safe/stable",
      "mini hop plyometric drill",
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

export const DAY0_DESCRIPTION = `## Day 0 checklist

### Equipment
- Apple Watch or wearable ready
- Polar H10 paired, if using
- Tripod/phone camera ready
- Journal/app ready
- Gym access or dumbbells/bands ready
- Cones/markers or wall-passing spot ready
- Waking Up app ready
- Supplements bought and doses agreed with doctor/pharmacist

### Videos (save as YYYY-MM-DD_week0_task.mp4)
- 60 sec typing, buttons, shoelaces, bottle caps, coins
- stair descent, single-leg stance, sit-to-stand, heel raises
- 6-minute walk, football wall passes, cone dribble
- reading + spontaneous speech samples

See Wiki: Day 0 for full clinical checklist.`;

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
