/**
 * 84-day Stoic daily rehab curriculum — original wording inspired by general Stoic
 * themes (four virtues, control, hardship, journal, resilience). Not copied
 * from any single book.
 *
 * @typedef {{ contentTitle: string, theory: string, task: string, durationMinutes: number, journalPrompt?: string }} StoicSlotContent
 * @typedef {{ dayTheme: string, virtue: string, morning: StoicSlotContent, midday: StoicSlotContent, evening: StoicSlotContent, tags?: string[], intensity?: "light"|"medium" }} StoicDayDefinition
 */

import { enrichDayDefinition } from "./stoic-theory-enrichment.mjs";

export const WEEK_THEMES = {
  1: "Control and calm effort",
  2: "Four virtues in rehab",
  3: "Opportunity in challenge",
  4: "Journal as transformation",
  5: "Hardship and inner peace",
  6: "Plato's view — perspective",
  7: "Resilience under uncertainty",
  8: "Social courage and normal life",
  9: "Discipline without harshness",
  10: "Body trust and calm action",
  11: "Integration with movement",
  12: "Ownership and path forward",
};

/** @param {StoicDayDefinition} def @returns {StoicDayDefinition} */
function day(def) {
  return {
    tags: ["stoicism"],
    intensity: "light",
    ...def,
  };
}

/** @type {StoicDayDefinition[]} */
const EXPLICIT_DAYS = [
  // —— Week 1: Control and calm effort ——
  day({
    dayTheme: "Control What You Can",
    virtue: "wisdom",
    morning: {
      contentTitle: "Separate Control from Noise",
      theory:
        "Some things are not fully up to you: symptom swings, other people's reactions, or how fast progress feels. Other things are yours: your next calm action, your attitude during one rep, a small promise kept. When you separate them, you can train well even on a hard day.",
      task:
        "Before your first rehab activity, write or think of two columns: \"Not fully in my control\" and \"My next useful action.\" Choose one calm action for today.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "One Calm Rep",
      theory:
        "Character is built in small moments — one repetition with calm attention. That rep is evidence you can act with dignity when the body feels uncertain. Partial practice still counts.",
      task:
        "During one rehab exercise, focus only on the next repetition. Smooth start, steady breath, no judging.",
      durationMinutes: 2,
    },
    evening: {
      contentTitle: "Evening Review",
      theory:
        "Evening review is calibration, not self-criticism. Note what you controlled well, where you over-controlled, and one useful action for tomorrow — without scoring symptoms.",
      task:
        "Write one thing you controlled well, one thing you tried to over-control, and one next useful action for tomorrow.",
      journalPrompt: "Where did I act with wisdom today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "The Obstacle Is Training",
    virtue: "courage",
    morning: {
      contentTitle: "Welcome Useful Difficulty",
      theory:
        "Stoics do not chase suffering, but they refuse to treat every difficulty as failure. A hard rehab day can train courage and patience if the challenge stays safe and bounded.",
      task:
        "Choose one safe rehab challenge today. Keep it small enough to complete.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Approach, Don't Avoid",
      theory:
        "Avoidance feels protective but slowly shrinks life. Courage grows through small, safe contact with what matters — one scaled step instead of monitoring and retreat.",
      task:
        "Do one small task you tend to avoid: stairs, left-hand use, walking, typing, or coordination work. Scale it safely.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Find the Opportunity",
      theory:
        "The evening question is not \"Did I suffer enough?\" but \"What did this train?\" Naming the quality turns a frustrating day into useful data for tomorrow.",
      task:
        "Write one difficulty from today and the character quality it trained.",
      journalPrompt: "What opportunity was hidden in today's obstacle?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Inner Peace Is Trained",
    virtue: "temperance",
    morning: {
      contentTitle: "Begin Without Fighting",
      theory:
        "Inner peace is beginning without extra resistance — the mental fight on top of an already demanding body. Three calm breaths and a simple start can lower that fight before movement.",
      task:
        "Before your first rehab movement, pause for 3 breaths. Feel feet, room, whole body. Begin simply.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Less Force, More Skill",
      theory:
        "Temperance means using the right amount of effort, not maximum effort.",
      task:
        "During one movement drill, reduce force by 10%. Aim for rhythm, coordination, and quality.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Peace Review",
      theory:
        "Peace grows when you stop demanding that the day should have been different.",
      task:
        "Write one moment you accepted reality and still acted well.",
      journalPrompt: "Where did I use less force today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "One Good Rep",
    virtue: "wisdom",
    morning: {
      contentTitle: "Process Over Symptoms",
      theory:
        "Progress is built by the quality of one repetition, not by proving symptoms changed today.",
      task:
        "Set one intention: \"Today I score the process — did I show up, train calmly, complete the useful action?\"",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "One Good Rep",
      theory: "A calm rep completed is success. Partial practice still counts.",
      task:
        "During one exercise, focus only on the next rep: smooth start, calm breath, no judging the outcome.",
      durationMinutes: 3,
    },
    evening: {
      contentTitle: "Process Check",
      theory: "Did I show up? Did I train calmly? Did I complete a useful action?",
      task:
        "Rate your process 0–3 (showed up → calm rep completed). Note one rep you are glad you did.",
      journalPrompt: "Did I complete a useful action today?",
      durationMinutes: 4,
    },
  }),
  day({
    dayTheme: "Morning Intention",
    virtue: "wisdom",
    morning: {
      contentTitle: "Set the Day's Role",
      theory:
        "The Stoic asks: what role am I playing today? Patient, partner, craftsperson, athlete-in-training.",
      task:
        "Choose one role and one behavior: \"As someone in rehab, I show up without drama.\"",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Chosen Standard",
      theory:
        "Choose the standard before discomfort chooses it for you: calm, precise, repeatable.",
      task:
        "Apply today's standard to one drill. Did you meet it without self-attack?",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Intention Review",
      theory: "Review whether you lived the intention — adjust, don't punish.",
      task: "Write: intention · what happened · one tweak for tomorrow.",
      journalPrompt: "Did I reduce reactivity today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "No Complaint Practice",
    virtue: "temperance",
    morning: {
      contentTitle: "Acceptance Without Passivity",
      theory:
        "Accepting what is does not mean giving up. It means stopping the fight long enough to act.",
      task:
        "Notice one complaint about symptoms today. Replace it with one useful action.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "No Complaint Block",
      theory:
        "Automatic complaining trains helplessness. Temperance includes speech.",
      task:
        "For 2 hours, no complaining about symptoms. If you notice it, replace with action.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Calm Speech Review",
      theory: "Justice toward yourself includes fair language, not contempt.",
      task: "List one harsh phrase you used and a fairer replacement.",
      journalPrompt: "Where was I kinder in my self-talk?",
      durationMinutes: 4,
    },
  }),
  day({
    dayTheme: "Week 1 Calibration",
    virtue: "wisdom",
    morning: {
      contentTitle: "Control Map Review",
      theory: "Weekly review is calibration, not verdict. You can continue tomorrow.",
      task:
        "Skim the week: one win, one over-control pattern, one next action.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Minimum Promise",
      theory: "Small promises kept build consistency better than grand plans.",
      task: "Define and complete today's non-negotiable minimum rehab.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Week 1 Review",
      theory: "Process over symptoms. Partial practice still counts.",
      task: "Write keep / stop / start for your Stoic layer next week.",
      journalPrompt: "What one adjustment matters most?",
      durationMinutes: 5,
    },
  }),
  // —— Week 2: Four virtues ——
  day({
    dayTheme: "Wisdom — Next Useful Action",
    virtue: "wisdom",
    morning: {
      contentTitle: "See Clearly First",
      theory:
        "Wisdom is separating fact from story before you act.",
      task:
        "Write one fact about today's rehab and one story your mind added. Act on the fact.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Next Useful Action",
      theory: "When stuck, wisdom asks: what is the smallest useful next step?",
      task: "Pick one stalled task. Do the next 2-minute slice of it.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Wisdom Review",
      theory: "Did I act with clarity or with panic?",
      task: "Where did wisdom guide you? Where did story mislead you?",
      journalPrompt: "What story did I drop today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Courage — Safe Difficulty",
    virtue: "courage",
    morning: {
      contentTitle: "Courage Is Contact",
      theory:
        "Courage is not fearlessness. It is useful action while afraid.",
      task: "Name one safe difficulty you will approach today.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Approach One Rung",
      theory: "Courage grows in small contacts, not heroic leaps.",
      task:
        "Do one mini-challenge: stairs, typing, public walk, or loaded drill — scaled safely.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Courage Review",
      theory: "Did I act with courage? Partial counts.",
      task: "List one approach you made and one you can repeat tomorrow.",
      journalPrompt: "Did I act with courage today?",
      durationMinutes: 4,
    },
    intensity: "medium",
  }),
  day({
    dayTheme: "Justice — Fair to Self and Others",
    virtue: "justice",
    morning: {
      contentTitle: "Fair Self-Talk",
      theory:
        "Justice includes treating your body and mind fairly — not as enemies.",
      task:
        "Before rehab, say: \"Firm and kind.\" Hold both through the first set.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Presence for Someone",
      theory: "Stoicism is lived in relationships, not only in isolation.",
      task:
        "Give 10 minutes of undistracted presence — without symptom talk unless needed.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Justice Review",
      theory: "Were you fair to yourself and others?",
      task: "One moment of fairness · one moment of harshness · one adjustment.",
      journalPrompt: "Was I fair to myself today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Temperance — Right Effort",
    virtue: "temperance",
    morning: {
      contentTitle: "Enough, Not Maximum",
      theory: "Temperance is the right amount of effort — not white-knuckling.",
      task: "Choose today's effort level: light, steady, or rest — on purpose.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Rhythm Over Force",
      theory: "Over-effort destroys coordination. Temperance protects skill.",
      task: "One drill at 90% force with better rhythm.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Temperance Review",
      theory: "Did I use the right amount of effort?",
      task: "Where was less force better? Where did rest serve you?",
      journalPrompt: "Did I train calmly?",
      durationMinutes: 4,
    },
  }),
  day({
    dayTheme: "Patience — Long Game",
    virtue: "temperance",
    morning: {
      contentTitle: "Nature Moves Gradually",
      theory: "Rehab is a long game. Patience is active, not passive waiting.",
      task: "Define today's minimum viable rehab. Commit to it.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Anti All-or-Nothing",
      theory: "Missing perfect is not failing. Partial practice still counts.",
      task: "If energy is low, do 30–50% version rather than zero.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Patience Review",
      theory: "Did you honor the long game today?",
      task: "One moment you accepted pace · one moment you rushed · lesson.",
      journalPrompt: "Did I stay patient with progress?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Consistency — Small Promises",
    virtue: "justice",
    morning: {
      contentTitle: "Keep Promises Small",
      theory: "Consistency comes from promises small enough to keep daily.",
      task: "Write one rehab promise for today you are 90% sure you can keep.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Show Up",
      theory: "Did I show up? That is the first process score.",
      task: "Complete your promised minimum before adding extras.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Promise Review",
      theory: "Calm rep completed — or partial counts. No harsh reset.",
      task: "Did you keep today's promise? If not, shrink tomorrow's.",
      journalPrompt: "Did I show up today?",
      durationMinutes: 4,
    },
  }),
  day({
    dayTheme: "Humility — Observe Without Ego",
    virtue: "wisdom",
    morning: {
      contentTitle: "Observe, Don't Perform",
      theory: "Humility is accurate seeing — without ego or collapse.",
      task: "During rehab, imagine a camera view: a person training, not performing.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Evidence Not Stories",
      theory: "Inspect judgments. Separate sensory fact from interpretation.",
      task: "Write one fact and one story about today's movement. Drop the story for one hour.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Virtue Week Review",
      theory: "Score character, not symptoms.",
      task: "One example each: wisdom, courage, justice, temperance — however small.",
      journalPrompt: "Which virtue should lead next week?",
      durationMinutes: 5,
    },
  }),
  // —— Week 3: Opportunity in challenge ——
  day({
    dayTheme: "Obstacle as Training",
    virtue: "courage",
    morning: {
      contentTitle: "Material for Strength",
      theory: "The obstacle is not the enemy; it is training material.",
      task: "Name today's hardest rehab moment. Say once: \"This is the rep.\"",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Train the Response",
      theory: "Opportunity in the obstacle — train the response, not the drama.",
      task: "Continue calmly through one hard moment or rest wisely without shame.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Obstacle Review",
      theory: "What did the obstacle train?",
      task: "Difficulty · quality trained · one repeat tomorrow.",
      journalPrompt: "What opportunity was in today's obstacle?",
      durationMinutes: 5,
    },
    intensity: "medium",
  }),
  day({
    dayTheme: "Hardship Builds Capacity",
    virtue: "courage",
    morning: {
      contentTitle: "Welcome Useful Hardship",
      theory:
        "Hardship can build capacity when chosen safely — not chased for its own sake.",
      task: "Pick one bounded discomfort: cold finish, boring set, or avoided drill.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Voluntary Difficulty Lite",
      theory: "Small chosen difficulty builds confidence in your coping.",
      task: "Complete your chosen difficulty safely. Stop at enough.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Capacity Review",
      theory: "Did hardship expand capacity or only exhaust you?",
      task: "What did you handle today that you might have avoided?",
      journalPrompt: "Did I welcome useful difficulty?",
      durationMinutes: 4,
    },
    intensity: "medium",
  }),
  day({
    dayTheme: "Fear as Information",
    virtue: "wisdom",
    morning: {
      contentTitle: "Right-Size Fear",
      theory: "Fear is information, not a command. Right-size it, then act.",
      task:
        "Write worst realistic outcome of today's drill and your coping plan.",
      durationMinutes: 4,
    },
    midday: {
      contentTitle: "Act With Information",
      theory: "Did I act with courage after right-sizing fear?",
      task: "Do the planned drill at calm tempo after your fear review.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Fear Review",
      theory: "Was the fear accurate? What happened when you acted anyway?",
      task: "Fear predicted · reality · lesson.",
      journalPrompt: "Did fear stop me or inform me?",
      durationMinutes: 5,
    },
    intensity: "medium",
  }),
  day({
    dayTheme: "Uncertainty Practice",
    virtue: "wisdom",
    morning: {
      contentTitle: "Act Without Guarantees",
      theory: "Not knowing is uncomfortable but survivable. You can act without full certainty.",
      task: "Say: \"I can act without full certainty.\" Pick one planned action.",
      durationMinutes: 2,
    },
    midday: {
      contentTitle: "Good Enough Action",
      theory: "Stoics act under imperfect conditions — 70% confidence is enough.",
      task: "Complete one useful task without waiting to feel ready.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Uncertainty Review",
      theory: "Where did uncertainty stop you? Where did you act anyway?",
      task: "One uncertain action you took · outcome · lesson.",
      journalPrompt: "Did I act under uncertainty?",
      durationMinutes: 4,
    },
  }),
  day({
    dayTheme: "View From Above",
    virtue: "wisdom",
    morning: {
      contentTitle: "Wider Perspective",
      theory:
        "Plato and the Stoics use perspective — zoom out so obsession shrinks without dismissing pain.",
      task:
        "Imagine your city from above; your rehab is one thread. Then set today's task.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Camera View",
      theory: "Watch yourself as a person training — not a drama.",
      task: "During one drill, hold camera view for 3 minutes. Continue calmly.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Perspective Review",
      theory: "Did perspective lead to action, not avoidance?",
      task: "One worry that shrank · one action that clarified.",
      journalPrompt: "What looked different from above?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Gratitude for Function",
    virtue: "justice",
    morning: {
      contentTitle: "Balance the Ledger",
      theory: "Gratitude is not denial. It balances attention so life is not only deficit.",
      task: "Name three functions still available today. Use one actively.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Use What Works",
      theory: "Train with the body you have today — not the one you wish you had.",
      task: "One drill adapted to today's energy without skipping entirely.",
      durationMinutes: 4,
    },
    evening: {
      contentTitle: "Gratitude Review",
      theory: "What function did you appreciate and use?",
      task: "Three functions · one you used · one thank-you to your body.",
      journalPrompt: "What can I thank my body for today?",
      durationMinutes: 5,
    },
  }),
  day({
    dayTheme: "Future Self Review",
    virtue: "wisdom",
    morning: {
      contentTitle: "Ten-Year Friend",
      theory: "Speak to yourself as a wise future friend would.",
      task: "Write three sentences from future-you encouraging today's rehab.",
      durationMinutes: 3,
    },
    midday: {
      contentTitle: "Wise Coach Voice",
      theory: "Internal voice can coach or attack. Choose coach.",
      task: "During rehab, use only coach language: specific, kind, forward-looking.",
      durationMinutes: 5,
    },
    evening: {
      contentTitle: "Week 3 Review",
      theory: "Opportunity in challenge — review the week without shame.",
      task: "Two opportunities taken · one missed without self-attack · next week focus.",
      journalPrompt: "What would future-me respect from this week?",
      durationMinutes: 5,
    },
  }),
];

/** @type {StoicDayDefinition[]} — days 22–84: scaled themes for weeks 4–12 */
const SCALED_WEEKS = [
  // Week 4 — Journal
  ...Array.from({ length: 7 }, (_, i) =>
    day({
      dayTheme: `Journal Day ${i + 1}`,
      virtue: ["wisdom", "temperance", "wisdom", "justice", "wisdom", "temperance", "wisdom"][i],
      morning: {
        contentTitle: "Action · Reaction · Lesson",
        theory: "Journal work transforms experience into choice — not venting alone.",
        task: "Preview today's theme: what action will you log tonight?",
        durationMinutes: 2,
      },
      midday: {
        contentTitle: "Train the Response",
        theory: "During rehab, notice reaction without obeying it automatically.",
        task: "After one block, note your reaction in one word before continuing.",
        durationMinutes: 4,
      },
      evening: {
        contentTitle: "Journal Transform",
        theory: "Write Action · Reaction · Lesson. Score process, not symptoms.",
        task: "Five-minute journal. End with one next useful action.",
        journalPrompt: "What lesson is worth keeping?",
        durationMinutes: 5,
      },
    }),
  ),
  // Weeks 5–12 — compact rotating templates (7 days each)
  ...[5, 6, 7, 8, 9, 10, 11, 12].flatMap((weekNum) => {
    const theme = WEEK_THEMES[weekNum];
    const virtues = ["courage", "temperance", "wisdom", "justice"];
    return Array.from({ length: 7 }, (_, i) => {
      const isReview = i === 6;
      return day({
        dayTheme: isReview ? `Week ${weekNum} Review` : theme,
        virtue: virtues[i % 4],
        morning: {
          contentTitle: isReview ? "Calm Calibration" : "Set the Mind",
          theory: isReview
            ? "Weekly review is calibration, not a verdict on your worth. Look for patterns so tomorrow can be slightly wiser."
            : `${theme}. Consistency comes from calm effort repeated, not from perfect symptom days.`,
          task: isReview
            ? "Skim the week: win · pattern · adjustment."
            : "Read once. One sentence to carry into rehab today.",
          durationMinutes: 3,
        },
        midday: {
          contentTitle: isReview ? "Minimum Promise" : "Train the Response",
          theory: isReview
            ? "Partial practice still counts. A minimum kept on a hard week is evidence of character."
            : "Notice your reaction without obeying it automatically — rushing, checking, or self-attack. Pause and return to one useful action.",
          task: isReview
            ? "Complete your minimum and stop without guilt."
            : "One calm rehab rep or useful action tied to today's theme.",
          durationMinutes: isReview ? 5 : 4,
        },
        evening: {
          contentTitle: isReview ? "Weekly Review" : "Evening Reflection",
          theory:
            "Evening journaling turns experience into choice. Write what you did, how you responded, and one lesson — then score the process, not symptoms.",
          task: isReview
            ? "Keep / stop / start for next week."
            : "Reflect on today's theme. One useful action completed?",
          journalPrompt: isReview
            ? "What adjustment matters most?"
            : "Did I complete a useful action today?",
          durationMinutes: 5,
        },
        intensity: weekNum >= 7 && !isReview ? "medium" : "light",
      });
    });
  }),
];

/** @type {StoicDayDefinition[]} */
const ALL_DAYS = [...EXPLICIT_DAYS, ...SCALED_WEEKS];

if (ALL_DAYS.length !== 84) {
  throw new Error(`Expected 84 curriculum days, got ${ALL_DAYS.length}`);
}

export function buildCurriculumRows() {
  return ALL_DAYS.map((def, index) => {
    const day = index + 1;
    return enrichDayDefinition({ day, ...def });
  });
}
