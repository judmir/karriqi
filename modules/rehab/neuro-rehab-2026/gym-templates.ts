export const GYM_A_DESCRIPTION = `## Gym A — Lower body + left leg control

- Warm-up: 5–10 min bike/walk + mobility
- Sit-to-stand or goblet squat: 3 sets
- Supported split squat: 3 sets each side
- Step-ups: 3 sets each side
- Slow step-downs: 2–3 sets each side
- Heel raises: 2–3 sets
- Balance: single-leg stance with support, 2–3 rounds
- Cool-down: easy walk + breathing

Keep session 45–60 min. Stop before you are destroyed.`;

export const GYM_B_DESCRIPTION = `## Gym B — Upper body + core + coordination

- Warm-up: 5–10 min
- Row: 3 sets
- Chest press or push-up variation: 3 sets
- Lat pulldown: 3 sets
- Shoulder press light/moderate: 2–3 sets
- Farmer carry or suitcase carry: 3 rounds
- Core anti-rotation / Pallof press: 2–3 sets
- Left-hand dexterity finisher: 5–10 min`;

export const GYM_C_DESCRIPTION = `## Gym C — Lower body + dynamic stability

- Warm-up: 5–10 min
- Romanian deadlift pattern: 3 sets
- Leg press or squat pattern: 3 sets
- Lateral step-down or lateral lunge: 2–3 sets
- Eccentric knee-control drill: 2–3 sets
- Direction-change walking drills: 5–10 min
- Optional mini hops only after Week 5 and only if safe/stable`;

export const GYM_D_DESCRIPTION = `## Gym D — Optional fourth day

Choose one:
- Easy full-body strength, OR
- Football-specific coordination, OR
- Mobility + balance + left-side control

Do not make Gym D a punishment day. It is optional.`;

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
