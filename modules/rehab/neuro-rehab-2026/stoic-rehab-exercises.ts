import type {
  StoicClassicalVirtue,
  StoicRehabExercise,
  StoicRehabIntensity,
  StoicRehabSlot,
} from "@/types/stoic-rehab";

/**
 * Stoic Path — daily resilience layer of the 12-week neuro-rehab program.
 *
 * Every rehab day gets three small Stoic activities inside the normal daily
 * checklist (not a separate course):
 *   - Morning Stoic Intention — prepare the mind before the day starts
 *   - Midday Stoic Challenge — use one real rehab difficulty as training
 *   - Evening Stoic Review — reflect and calibrate without self-attack
 *
 * Framing rules (see docs/rehab/final_12_week_neuro_rehab_plan.txt):
 * physical rehab stays central; Stoicism trains calm effort, courage, and
 * consistency. Success is scored on process ("showed up", "calm rep
 * completed"), never on whether symptoms improved. No shame language.
 * All wording is original.
 */

export const STOIC_REHAB_WEEK_THEMES: Record<number, string> = {
  1: "Control and calm response",
  2: "The Stoic virtues in rehab",
  3: "The Stoic Challenge",
  4: "Retest week — measure calmly",
  5: "Effort as training",
  6: "Steadiness without drama",
  7: "Attention under complexity",
  8: "Retest week — honest review",
  9: "Courage in real life",
  10: "Natural movement, quiet mind",
  11: "Consolidation — keep what works",
  12: "Final review and the path forward",
};

export const STOIC_REHAB_PROGRAM_DAYS = 84;

export const STOIC_REHAB_EXERCISES_PER_DAY = 3;

export const STOIC_REHAB_SLOT_CHECKLIST_TITLES: Record<StoicRehabSlot, string> =
  {
    morning: "Morning Stoic Intention",
    midday: "Midday Stoic Challenge",
    evening: "Evening Stoic Review",
  };

type StoicSlotDef = {
  title: string;
  theory: string;
  task: string;
  minutes: number;
  prompt: string;
};

type StoicDayDef = {
  day: number;
  theme: string;
  virtue: StoicClassicalVirtue;
  /** Midday challenge intensity; mornings and evenings are always light. */
  intensity?: StoicRehabIntensity;
  /** Legacy process-virtue bucket used by week summaries. */
  processTag?: "courage" | "patience" | "attention" | "consistency";
  morning: StoicSlotDef;
  midday: StoicSlotDef;
  evening: StoicSlotDef;
};

function slotExercise(
  def: StoicDayDef,
  slot: StoicRehabSlot,
  content: StoicSlotDef,
): StoicRehabExercise {
  const week = Math.ceil(def.day / 7);
  return {
    id: `stoic-day-${String(def.day).padStart(2, "0")}-${slot}`,
    day: def.day,
    week,
    slot,
    title: `${STOIC_REHAB_SLOT_CHECKLIST_TITLES[slot]} · ${content.title}`,
    contentTitle: content.title,
    dayTheme: def.theme,
    theme: STOIC_REHAB_WEEK_THEMES[week],
    virtue: def.virtue,
    category: "stoicism",
    theory: content.theory,
    task: content.task,
    journalPrompt: content.prompt,
    durationMinutes: content.minutes,
    tags: def.processTag ? ["stoicism", def.processTag] : ["stoicism"],
    intensity: slot === "midday" ? (def.intensity ?? "light") : "light",
    suggestedWhen:
      slot === "morning"
        ? "morning"
        : slot === "midday"
          ? "during_life"
          : "evening",
  };
}

function stoicDay(def: StoicDayDef): StoicRehabExercise[] {
  return [
    slotExercise(def, "morning", def.morning),
    slotExercise(def, "midday", def.midday),
    slotExercise(def, "evening", def.evening),
  ];
}

// ---------------------------------------------------------------------------
// Week 1 — Control and calm response
// ---------------------------------------------------------------------------

const WEEK_1: StoicDayDef[] = [
  {
    day: 1,
    theme: "Control What You Can",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Two Lists",
      theory:
        "Stoicism starts with one separation: what is yours to choose and what is not. Symptom levels, recovery speed, and how today feels are not fully yours. Your next useful action always is.",
      task: "Before your first rehab activity, name one thing not fully in your control today and one useful action that is. Carry only the second into the day.",
      minutes: 3,
      prompt: "What is my one useful action today?",
    },
    midday: {
      title: "One Calm Rep",
      theory:
        "A Stoic day does not require the whole day to go well. One repetition done with calm attention is already training the response — and the response is the part you own.",
      task: "During one rehab movement, focus only on the next repetition: smooth start, steady breath, relaxed jaw, no judging.",
      minutes: 3,
      prompt: "What did the calm rep feel like?",
    },
    evening: {
      title: "Review Without Attack",
      theory:
        "Evening review is calibration, not a courtroom. You are collecting information about your responses so tomorrow can be slightly wiser.",
      task: "Write one moment you responded well, one moment you fought reality, and one better response for tomorrow.",
      minutes: 5,
      prompt: "Where did I control my response today?",
    },
  },
  {
    day: 2,
    theme: "The Next Useful Action",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Shrink the Question",
      theory:
        "\"Will I recover?\" is not answerable this morning. \"What is the next useful action?\" always is. Stoics keep returning to the answerable question.",
      task: "Pick the single next useful action for this morning — one exercise, one recording, one walk — and start it before the mind reopens the big question.",
      minutes: 2,
      prompt: "What question am I choosing to answer today?",
    },
    midday: {
      title: "When Stuck, Go Smaller",
      theory:
        "Hesitation usually means the step is too big, not that you are too weak. The Stoic move is to shrink the action until it becomes doable, then do it.",
      task: "When you notice hesitation during a rehab task today, cut the task in half — fewer reps, shorter distance — and complete that half calmly.",
      minutes: 4,
      prompt: "What did I shrink, and did it get me moving?",
    },
    evening: {
      title: "Chain of Small Actions",
      theory:
        "A day is judged fairly by the chain of small useful actions, not by how it felt. Feelings vary with sleep and stress; the chain is yours.",
      task: "List three useful actions you completed today, however small. Note the one you almost skipped.",
      minutes: 4,
      prompt: "Which small action mattered most today?",
    },
  },
  {
    day: 3,
    theme: "The Obstacle Is Training",
    virtue: "courage",
    processTag: "courage",
    morning: {
      title: "Name Today's Test",
      theory:
        "When something unwanted appears, you can treat it as a problem only, or also as a test set by a demanding coach. The second framing turns the same difficulty into material.",
      task: "Choose one safe rehab challenge for today — stairs, left-hand task, a harder drill — and decide in advance how a calm person would approach it.",
      minutes: 3,
      prompt: "What is today's Stoic test?",
    },
    midday: {
      title: "Approach, Don't Avoid",
      theory:
        "Avoidance feels protective but quietly shrinks life. Courage grows through small, safe contact with what matters — one scaled attempt, not a heroic leap.",
      task: "Do one small task you tend to avoid: stair descent, left-hand typing, a walk, speech practice. Scale it so you can finish it calmly.",
      minutes: 5,
      prompt: "What did I approach instead of avoid?",
    },
    evening: {
      title: "Find the Training",
      theory:
        "The Stoic evening question is not only \"why did this happen?\" but \"what did it train?\" Naming the quality — patience, courage, steadiness — turns friction into progress.",
      task: "Write one difficulty from today and the quality it trained in you.",
      minutes: 5,
      prompt: "What was today's obstacle training me for?",
    },
  },
  {
    day: 4,
    theme: "Calm Repetition",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Begin Without Fighting",
      theory:
        "Inner resistance — dreading, bargaining, replaying — is a second workout on top of the real one. Starting simply, without commentary, removes the heavier half.",
      task: "Before your first rehab movement, pause for three slow breaths. Feel feet, room, whole body. Then begin with no announcement.",
      minutes: 2,
      prompt: "What does starting without a fight feel like?",
    },
    midday: {
      title: "Less Force, More Skill",
      theory:
        "Temperance is the right amount of effort, not the maximum. Over-gripping and over-trying degrade coordination; ease is a skill you can practice on purpose.",
      task: "During one movement drill, deliberately reduce force by about ten percent. Aim for rhythm and quality instead of power.",
      minutes: 5,
      prompt: "Where did less force work better?",
    },
    evening: {
      title: "The Quiet Ledger",
      theory:
        "Peace grows when you stop demanding the day should have been different and instead study how you met it. Acceptance and effort are not opposites.",
      task: "Write one moment where you accepted reality as it was and still acted well inside it.",
      minutes: 5,
      prompt: "Where did I accept and still act?",
    },
  },
  {
    day: 5,
    theme: "Process Over Outcome",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Score the Right Thing",
      theory:
        "An archer controls the draw and the release, not the wind. You control showing up, the quality of attention, and the honesty of the log — so those are what get scored.",
      task: "Set today's success line out loud or on paper: \"Today counts if I show up and train calmly.\" Nothing about symptoms belongs in it.",
      minutes: 2,
      prompt: "What is my definition of a good day today?",
    },
    midday: {
      title: "The Wind Is Not Yours",
      theory:
        "Mid-task, the mind checks results: is it better, is it worse? That is watching the wind. The Stoic returns attention to the draw — this rep, this breath.",
      task: "During one exercise, each time you catch yourself checking how it compares to yesterday, quietly return to the current rep. Count the returns without judging them.",
      minutes: 4,
      prompt: "How many times did I return attention to the rep?",
    },
    evening: {
      title: "Process Scoreboard",
      theory:
        "Review the day like a coach who only sees effort, focus, and follow-through — the coach cannot see symptoms at all. That scoreboard is the fair one.",
      task: "Give yourself an honest process note: showed up? trained calmly? logged honestly? One sentence each.",
      minutes: 4,
      prompt: "Did I complete the process, whatever the outcome?",
    },
  },
  {
    day: 6,
    theme: "The No-Complaint Practice",
    virtue: "temperance",
    processTag: "attention",
    morning: {
      title: "Notice the Narrator",
      theory:
        "Complaint is a habit of narration, and narration trains the nervous system in what to expect. Today is for noticing it — not for shaming it.",
      task: "Set one intention: today I notice every complaint about my body, spoken or silent, with curiosity instead of guilt.",
      minutes: 2,
      prompt: "What does my complaint habit sound like?",
    },
    midday: {
      title: "Two Complaint-Free Hours",
      theory:
        "Marcus Aurelius practiced doing what needed doing without adding commentary. A bounded window makes this practical: not forever, just two hours.",
      task: "Choose a two-hour window that includes one rehab task. Inside it, replace each complaint you catch with one small action or one neutral observation.",
      minutes: 5,
      prompt: "What replaced my complaints in the window?",
    },
    evening: {
      title: "Complaint Audit",
      theory:
        "Some complaints carry real information — genuine warning signs deserve action, not suppression. The audit separates signal from static.",
      task: "Write the day's most frequent complaint. Decide: was it a signal needing action, or static? If a signal, name the action.",
      minutes: 5,
      prompt: "Which complaint was signal, which was static?",
    },
  },
  {
    day: 7,
    theme: "Acceptance Without Passivity",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Both Hands Full",
      theory:
        "One hand accepts today's starting point exactly as it is; the other holds the training plan. Stoicism needs both hands — dropping either one is where people go wrong.",
      task: "Say once, plainly: \"This is where I start today.\" Then name the one session or task the plan asks of you.",
      minutes: 3,
      prompt: "What am I accepting, and what am I still doing?",
    },
    midday: {
      title: "Train the Body You Have Today",
      theory:
        "Waiting for a better day to train well is a quiet form of refusal. The available body is the training partner you actually have.",
      task: "Do today's scheduled task adapted to today's real energy — a lighter version if needed, but not zero. Partial practice still counts.",
      minutes: 5,
      prompt: "How did I adapt instead of cancel?",
    },
    evening: {
      title: "Week One Review",
      theory:
        "A week of practicing control, calm reps, and honest review is a real foundation. Review it like a builder inspecting week-one brickwork: matter-of-fact, forward-looking.",
      task: "Write the week's best response to difficulty, its most common fight with reality, and one habit to carry into week two.",
      minutes: 5,
      prompt: "What did week one teach me about my responses?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 2 — The Stoic virtues in rehab
// ---------------------------------------------------------------------------

const WEEK_2: StoicDayDef[] = [
  {
    day: 8,
    theme: "Wisdom — The Right Next Action",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Fact, Then Story",
      theory:
        "Wisdom begins with seeing clearly: this is what happened, and this is the story I added. The fact usually allows action; the story usually forbids it.",
      task: "Write one plain fact about your body this morning and one story your mind attached to it. Plan today's action from the fact only.",
      minutes: 3,
      prompt: "What fact did I act on today?",
    },
    midday: {
      title: "The Two-Minute Slice",
      theory:
        "Wise action is often just the smallest next slice of a stalled thing. Momentum is a decision about size, not a mood that arrives.",
      task: "Pick one rehab task you have been circling without starting. Do only its first two minutes, with full attention, then decide freely whether to continue.",
      minutes: 4,
      prompt: "What did the first two minutes unlock?",
    },
    evening: {
      title: "Clarity Review",
      theory:
        "In review, wisdom asks one question: where did I act from what was actually true, and where from what I feared was true?",
      task: "Write one decision you made from fact and one you made from story. No punishment — just mark them.",
      minutes: 5,
      prompt: "What story misled me today, and what fact served me?",
    },
  },
  {
    day: 9,
    theme: "Courage — Safe Difficulty",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Courage Has a Size",
      theory:
        "Courage is not fearlessness and not recklessness; it is choosing a difficulty that is real but survivable. The right size is uncomfortable and safe at once.",
      task: "Name one rung of difficulty for today — slightly harder than comfortable, clearly within safety. Say when you will attempt it.",
      minutes: 2,
      prompt: "What is today's right-sized difficulty?",
    },
    midday: {
      title: "Climb One Rung",
      theory:
        "The nervous system updates through lived evidence, not arguments. One completed contact with a feared task is worth more than an hour of reassurance.",
      task: "Attempt your chosen rung now: the stairs, the left-hand task, the walk, the drill. Slow is fine. Finishing calmly is the win.",
      minutes: 5,
      prompt: "What evidence did the attempt give me?",
    },
    evening: {
      title: "Courage Log",
      theory:
        "Courage compounds when it is witnessed — even if the only witness is your own log. Unrecorded brave acts fade; recorded ones become identity.",
      task: "Write today's act of courage in one sentence, however small. Add what you would tell a friend who did the same.",
      minutes: 4,
      prompt: "What did I do today while afraid?",
    },
  },
  {
    day: 10,
    theme: "Justice — Fair to Yourself and Others",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Firm and Fair",
      theory:
        "Justice includes how you treat yourself. A fair coach demands effort and forbids contempt; most people manage only one of the two.",
      task: "Choose this morning's tone in two words: \"firm and fair.\" Hold both through your first task.",
      minutes: 2,
      prompt: "Am I being both firm and fair?",
    },
    midday: {
      title: "Give a Clean Ten Minutes",
      theory:
        "Stoicism is practiced among people, not only in drills. Full presence with someone — no symptom monitoring in the background — is justice in its everyday form.",
      task: "Give one person ten minutes of undivided attention today: conversation, help, or shared time, with your attention on them.",
      minutes: 5,
      prompt: "What changed when my attention went outward?",
    },
    evening: {
      title: "Fairness Review",
      theory:
        "Would the day's self-talk be acceptable if said to someone you love in the same situation? That is the justice test, and it is strict.",
      task: "Write one harsh phrase you aimed at yourself today and its fair replacement. Say the replacement once.",
      minutes: 5,
      prompt: "Was I fair to myself today?",
    },
  },
  {
    day: 11,
    theme: "Temperance — The Right Amount",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Choose the Dose",
      theory:
        "Effort is a dose, and the right dose changes daily. Choosing it deliberately in the morning beats discovering it by crashing in the evening.",
      task: "Based on sleep and energy, choose today's dose on purpose: light, steady, or full. Write it down so evening-you can check it.",
      minutes: 2,
      prompt: "Did I choose my dose or did momentum choose it?",
    },
    midday: {
      title: "Ninety Percent Drill",
      theory:
        "At maximum effort, precision leaves first. Backing off slightly is not weakness; it is buying back the coordination the task actually needs.",
      task: "Do one drill at ninety percent of your instinctive effort. Put the saved ten percent into rhythm and smoothness.",
      minutes: 5,
      prompt: "What improved when I eased off?",
    },
    evening: {
      title: "Dose Review",
      theory:
        "Temperance also governs rest: stopping on time is the same virtue as starting on time. Both are the right amount at the right moment.",
      task: "Compare tonight: the dose you chose this morning versus what you actually did. Note one adjustment for tomorrow.",
      minutes: 4,
      prompt: "Did I use the right amount of effort and rest?",
    },
  },
  {
    day: 12,
    theme: "Patience — The Long Game",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "The Gardener's Clock",
      theory:
        "A gardener waters daily without demanding the plant grow today. Nervous systems, like gardens, respond to seasons of consistent input — not to urgency.",
      task: "Say once: \"I am on the gardener's clock.\" Then define today's watering — the minimum session you will do regardless of mood.",
      minutes: 3,
      prompt: "What is today's watering?",
    },
    midday: {
      title: "Slow On Purpose",
      theory:
        "Rushing a rehab task usually signals a wish to be done with the body rather than in it. Deliberate slowness is patience made physical.",
      task: "Do one familiar task at three-quarters speed — a walk, a drill, a typing block. Let it take the time it takes.",
      minutes: 5,
      prompt: "What did slowness let me notice?",
    },
    evening: {
      title: "Long-Game Review",
      theory:
        "Impatience always compares today to yesterday. Patience compares this month to last month, which is the only comparison that carries real information.",
      task: "Write one thing that is easier now than it was two or more weeks ago — however slight. That is the long game speaking.",
      minutes: 4,
      prompt: "What does the month-scale view show?",
    },
  },
  {
    day: 13,
    theme: "Consistency — Small Promises",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "One Keepable Promise",
      theory:
        "Self-trust is built the same way trust in anyone is built: promises kept. The trick is making promises small enough to survive a bad day.",
      task: "Make one rehab promise for today that you are at least ninety percent sure you can keep. Write it as a single sentence.",
      minutes: 2,
      prompt: "What promise did I make this morning?",
    },
    midday: {
      title: "Promise First, Extras Later",
      theory:
        "Enthusiasm wants to add extras before the basics are done; that is how streaks die. The promised minimum gets paid first, like rent.",
      task: "Complete this morning's promised task before adding anything optional. If energy remains afterward, extras are a free bonus.",
      minutes: 5,
      prompt: "Did the promise get paid first?",
    },
    evening: {
      title: "Promise Ledger",
      theory:
        "A kept promise is logged as evidence; a broken one is information about sizing, not character. Either way tomorrow's promise gets calibrated, not cancelled.",
      task: "Record: promise kept or not. If not, write tomorrow's promise one size smaller. If yes, keep the size — do not inflate it.",
      minutes: 4,
      prompt: "What does my promise ledger say about sizing?",
    },
  },
  {
    day: 14,
    theme: "Humility — Observe Without Ego",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "The Student Stance",
      theory:
        "Ego wants rehab to prove something; humility wants it to teach something. The student stance — curious, unoffended by difficulty — learns faster.",
      task: "Set the stance for today: \"I am studying this body, not defending a verdict about it.\" Approach the first task as an experiment.",
      minutes: 3,
      prompt: "What am I curious about today?",
    },
    midday: {
      title: "The Observer's Rep",
      theory:
        "Watching yourself the way a kind scientist would — noting what happens without inserting a self-judgment — is a skill, and it steadies movement.",
      task: "During one exercise, narrate neutrally in your head: \"arm lifts, breath steady, grip tightens.\" Facts only, no grades.",
      minutes: 4,
      prompt: "What did neutral observation change?",
    },
    evening: {
      title: "Virtue Week Review",
      theory:
        "This week walked through wisdom, courage, justice, temperance, patience, consistency, humility. A review finds where each showed up uninvited — proof they are becoming habits.",
      task: "Write one small real example of each: a wise choice, a brave contact, a fair word, a right dose. One line each is enough.",
      minutes: 5,
      prompt: "Which virtue is quietly becoming natural?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 3 — The Stoic Challenge
// ---------------------------------------------------------------------------

const WEEK_3: StoicDayDef[] = [
  {
    day: 15,
    theme: "Setback as Test",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "The Test Frame",
      theory:
        "Imagine setbacks are set by examiners who only assign tests you can pass. The frame is a tool, not a belief — it converts \"why me?\" into \"how do I pass this one?\"",
      task: "Pre-load the frame: decide now that the first unwanted thing today gets greeted internally as \"ah — a test.\" Notice what that does.",
      minutes: 3,
      prompt: "What test arrived, and how did the frame change it?",
    },
    midday: {
      title: "Pass One Test",
      theory:
        "Passing a Stoic test rarely means fixing the situation. It means responding with more composure than the situation invited.",
      task: "Take today's first genuine annoyance — a hard rep, a delay, a clumsy moment — and pass it: one breath, one deliberate calm action, continue.",
      minutes: 4,
      prompt: "How was my response better than the situation invited?",
    },
    evening: {
      title: "Test Results",
      theory:
        "Grading your own test is done on response only: not \"did the difficulty vanish\" but \"was my answer composed, useful, proportionate?\"",
      task: "Write today's main test and grade your response honestly — what was composed about it, what you would answer differently next time.",
      minutes: 5,
      prompt: "What grade does my response earn, and why?",
    },
  },
  {
    day: 16,
    theme: "Frustration as Material",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Expect the Friction",
      theory:
        "Frustration doubles when it arrives unexpected. Seneca advised rehearsing the day's likely frictions in advance — not to worry, but to remove the surprise tax.",
      task: "Name today's two most likely frustrations — a slow hand, a heavy leg, an interruption. Say how the calm version of you meets each.",
      minutes: 3,
      prompt: "Which rehearsed friction actually came?",
    },
    midday: {
      title: "Use the Heat",
      theory:
        "Frustration is energy with bad steering. Caught early — jaw, shoulders, breath — it can be steered into one precise, unhurried repetition instead of a spiral.",
      task: "When frustration first appears today, catch it in the body, exhale once, and spend its energy on one precise slow rep of whatever you were doing.",
      minutes: 4,
      prompt: "Where in my body does frustration announce itself?",
    },
    evening: {
      title: "Friction Report",
      theory:
        "Reviewed calmly, frustration is a map: it marks exactly where expectation and reality disagree. That is useful surveying, not failure.",
      task: "Write what frustrated you most today and the expectation hiding underneath it. Decide if the expectation needs resizing.",
      minutes: 5,
      prompt: "What expectation was underneath today's frustration?",
    },
  },
  {
    day: 17,
    theme: "Fear as Information",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Right-Size the Fear",
      theory:
        "Fear is a report, not an order. Some reports are accurate and deserve respect; many are inflated. The Stoic reads the report, checks it against facts, then decides.",
      task: "Write the worst realistic outcome of today's hardest planned task, plus how you would cope if it happened. Notice the size of the fear after writing.",
      minutes: 4,
      prompt: "How accurate was this morning's fear report?",
    },
    midday: {
      title: "Act on the Facts",
      theory:
        "After right-sizing, action is the natural next step — done at a calm tempo that tells the nervous system there is no emergency here.",
      task: "Do the task you fear-checked this morning, deliberately unhurried. If it needs scaling, scale the task, not the intention.",
      minutes: 5,
      prompt: "What actually happened versus what fear predicted?",
    },
    evening: {
      title: "Prediction Review",
      theory:
        "Fear keeps its power by never being audited. Comparing prediction to outcome, in writing, steadily reduces its credit rating.",
      task: "Write: fear's prediction, the actual result, the lesson. Three lines, kept where tomorrow's fear can see them.",
      minutes: 4,
      prompt: "What is fear's track record so far?",
    },
  },
  {
    day: 18,
    theme: "Uncertainty Practice",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Act Without Guarantees",
      theory:
        "No one is granted certainty about outcomes — recovery timelines included. The Stoic acts well under uncertainty because that is the only condition ever on offer.",
      task: "Say plainly: \"I do not need certainty to train today.\" Then pick the day's first action and begin it as planned.",
      minutes: 2,
      prompt: "What did I do today without needing a guarantee first?",
    },
    midday: {
      title: "The Seventy Percent Rule",
      theory:
        "Waiting to feel ready is uncertainty wearing a disguise. Seventy percent confidence is enough for a scaled, safe rehab task — readiness follows action more often than it precedes it.",
      task: "Choose one useful task you feel about seventy percent ready for. Do the safe, scaled version now instead of waiting for a better feeling.",
      minutes: 4,
      prompt: "What happened when I moved at seventy percent ready?",
    },
    evening: {
      title: "Uncertainty Review",
      theory:
        "Living with an open question is a trainable capacity. Every day you act well without answers, the open question loses its power to freeze you.",
      task: "Write one uncertainty you carried today and one useful thing you did anyway. Note that both fit in the same day.",
      minutes: 4,
      prompt: "Can I hold the open question and still move?",
    },
  },
  {
    day: 19,
    theme: "The View From Above",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Zoom Out",
      theory:
        "Marcus Aurelius pictured his troubles from high above — the city, the crowds, the brevity. Perspective does not erase the difficulty; it restores its true proportions.",
      task: "For one minute, picture today from far above: your street, your city, one person doing careful daily training among millions. Then set today's task from that height.",
      minutes: 3,
      prompt: "What size is my difficulty from above?",
    },
    midday: {
      title: "The Wide Lens Rep",
      theory:
        "Obsessive zoom-in — on a hand, a leg, a syllable — tightens body and mind together. Widening attention to the whole body and the room often smooths the very thing being watched.",
      task: "During one exercise, widen attention: whole body, feet on floor, sounds of the room. Do three reps in that wide state.",
      minutes: 4,
      prompt: "What changed with the wider lens?",
    },
    evening: {
      title: "Proportion Review",
      theory:
        "The evening version of the view from above looks back at the day and asks: what will this look like in a year? Most of the day resizes honestly under that question.",
      task: "Write today's biggest worry, then its likely size one year from now. Keep whatever remains genuinely important; let the rest resize.",
      minutes: 5,
      prompt: "What kept its size at one year, and what shrank?",
    },
  },
  {
    day: 20,
    theme: "Gratitude for Available Function",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Count What Works",
      theory:
        "Attention trained only on deficits gives a false report of your life. Negative visualization runs backwards too: imagine losing what still works, and notice it is already here.",
      task: "Name three functions available to you this morning — eyes reading this, lungs breathing, a hand gripping. Choose one to use deliberately today.",
      minutes: 3,
      prompt: "What is working that I usually skip over?",
    },
    midday: {
      title: "Use It With Thanks",
      theory:
        "Gratitude in Stoicism is active: the thank-you is paid by using the function, fully and attentively, while it is here to use.",
      task: "Take the function you chose this morning and use it in one rehab task with full attention — as if using it were a privilege, because it is.",
      minutes: 4,
      prompt: "What was it like to use a function as a privilege?",
    },
    evening: {
      title: "The Balanced Ledger",
      theory:
        "An honest evening ledger has two columns, and most days the \"still works\" column is far longer than the mind's report suggested.",
      task: "Write both columns for today: what was hard, and what worked. Read the second column twice.",
      minutes: 5,
      prompt: "What does the full ledger actually show?",
    },
  },
  {
    day: 21,
    theme: "Future-Self Review",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Letter From Ahead",
      theory:
        "Your future self has finished this program and knows how the story continued. Borrowing that voice for three sentences is a surprisingly reliable source of good advice.",
      task: "Write three sentences from future-you to today-you about this morning's training. Notice the tone that voice naturally uses.",
      minutes: 3,
      prompt: "What does future-me consistently tell me?",
    },
    midday: {
      title: "Train For the Witness",
      theory:
        "Acting as someone worth becoming — during one concrete task — is how identity is actually built: not decided once, but rehearsed daily.",
      task: "Do one rehab task today exactly the way the person you are becoming would do it: unhurried, precise, without complaint.",
      minutes: 4,
      prompt: "How does the person I am becoming train?",
    },
    evening: {
      title: "Week Three Review",
      theory:
        "Three weeks in: tests reframed, fear audited, perspective practiced. The review question is which tool earned a permanent place in your kit.",
      task: "Write the one Stoic tool from these three weeks that helped most, one that needs more practice, and how week four — a retest week — should feel.",
      minutes: 5,
      prompt: "Which tool is now mine, and which needs work?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 4 — Retest week: measure calmly (reduced volume; repeat baseline tests)
// ---------------------------------------------------------------------------

const WEEK_4: StoicDayDef[] = [
  {
    day: 22,
    theme: "The Test Is Not a Verdict",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Measurement, Not Judgment",
      theory:
        "Retest week compares recordings, not worth. A measurement is a photograph of one moment under one set of conditions — useful data, never a verdict on you.",
      task: "Before any retest task this week, say once: \"I am collecting data, not receiving a sentence.\" Set up the first comparison task calmly.",
      minutes: 3,
      prompt: "Can I hold a measurement without turning it into a verdict?",
    },
    midday: {
      title: "Perform For No One",
      theory:
        "Testing pressure comes from imagining an audience that keeps score. There is no audience — only you, a camera, and a protocol designed to help you.",
      task: "During one retest or practice task today, deliberately drop the performance: same task, done as an ordinary rep, no occasion made of it.",
      minutes: 4,
      prompt: "What changed when no one was watching, including me?",
    },
    evening: {
      title: "Data Without Drama",
      theory:
        "The Stoic reads results the way a navigator reads instruments: adjust the course, keep sailing. Neither celebration nor despair improves the reading.",
      task: "Write one neutral sentence about anything you measured or noticed today — the sentence a navigator would log, no adjectives.",
      minutes: 4,
      prompt: "What is the neutral sentence for today?",
    },
  },
  {
    day: 23,
    theme: "Same Camera, Same Calm",
    virtue: "temperance",
    processTag: "consistency",
    morning: {
      title: "Ritual Steadies the Hand",
      theory:
        "The retest protocol — same room, same light, same order — exists so conditions stay honest. Treating it as a calm ritual also keeps the tester honest and settled.",
      task: "Review today's retest or training setup like a ritual: place, order, timing. Decide the pace before starting, and let it be unhurried.",
      minutes: 3,
      prompt: "Did the ritual hold me steady?",
    },
    midday: {
      title: "One Take Is Enough",
      theory:
        "Re-recording until it looks better corrupts the data and feeds the checking habit. One honest take shows reality; reality is what the plan needs.",
      task: "For any filmed or measured task today: one honest take, then stop. If the urge to redo appears, note it and move on — that urge is today's training.",
      minutes: 4,
      prompt: "Could I let one honest take stand?",
    },
    evening: {
      title: "Honesty Review",
      theory:
        "The most valuable property of your whole tracking system is honesty. Guarding it against wishful edits is a quiet act of self-respect.",
      task: "Confirm in writing: today's records are honest, unedited, unembellished. Note one moment the urge to polish appeared.",
      minutes: 4,
      prompt: "Is my record honest enough to trust in week twelve?",
    },
  },
  {
    day: 24,
    theme: "Numbers Without Stories",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Let the Number Be a Number",
      theory:
        "A typing count or a stair time is one data point wearing no meaning of its own. Meaning arrives later, from trends — the morning's job is only to collect cleanly.",
      task: "Before today's tasks, decide: any number produced today gets written down and left alone until the weekly review. No same-day interpretation.",
      minutes: 2,
      prompt: "Can I collect without interpreting?",
    },
    midday: {
      title: "Catch the Storyteller",
      theory:
        "Between a result and your next breath, a storyteller inserts a conclusion — \"worse, therefore...\" Catching that insertion is the day's real exercise.",
      task: "After any measured task today, watch for the first story that appears about the result. Name it — \"conclusion\" — and return to the next task.",
      minutes: 4,
      prompt: "What conclusion tried to sneak in today?",
    },
    evening: {
      title: "Trend, Not Point",
      theory:
        "Single points scatter; trends inform. The four-week comparison this week is the first real trend of the program — that is where attention belongs.",
      task: "Write one sentence about the difference between today's single data points and what a four-week trend could actually tell you.",
      minutes: 4,
      prompt: "Am I reading points or trends?",
    },
  },
  {
    day: 25,
    theme: "Comparing Fairly",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Court Rules for Comparison",
      theory:
        "Week-zero-versus-week-four deserves fair court rules: same conditions acknowledged, context recorded, no cherry-picking either way — against yourself or for yourself.",
      task: "Before looking at any comparison, write the context of this week: sleep, stress, load. Fair judgment needs the context on record first.",
      minutes: 3,
      prompt: "What context does a fair comparison need?",
    },
    midday: {
      title: "Credit What Held",
      theory:
        "Justice notices maintenance, not just gains. In rehab, a function that held steady through four weeks of load is quietly good news the deficit-focused eye skips.",
      task: "During today's session, name one thing that has simply held steady for four weeks. Give it the one sentence of credit it earned.",
      minutes: 3,
      prompt: "What held steady, and did I credit it?",
    },
    evening: {
      title: "The Fair Verdict",
      theory:
        "A fair review states improved, unchanged, and harder — all three columns — in plain words. Anything less is spin, and spin corrupts next month's decisions.",
      task: "Write the three columns for anything you compared this week: improved, unchanged, harder. One line each, plain words.",
      minutes: 5,
      prompt: "Did all three columns get honest entries?",
    },
  },
  {
    day: 26,
    theme: "Rest as a Decision",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Reduced Volume, Full Intention",
      theory:
        "Retest week reduces training volume on purpose. Doing less by design is a different act from doing less by collapse — the difference is the decision.",
      task: "State today's reduced plan out loud as a decision: \"Today is lighter because the plan says so.\" Notice any guilt, and let the plan overrule it.",
      minutes: 2,
      prompt: "Did rest feel like a decision or a defeat?",
    },
    midday: {
      title: "Rest Without Leaking",
      theory:
        "Rest that is spent worrying about resting restores nothing. The skill is resting the way you would train: deliberately, with attention on the rest itself.",
      task: "Take one genuinely restful block today — a walk without pace goals, sitting with tea, light mobility — and keep attention in it, not on lost training.",
      minutes: 5,
      prompt: "Did my rest actually restore?",
    },
    evening: {
      title: "Recovery Review",
      theory:
        "The program treats recovery as infrastructure: sleep, ease, and lighter weeks are what make the loading weeks work. Respecting that is temperance applied to a calendar.",
      task: "Write how today's lighter load actually felt in the body and mood, without deciding whether it \"counts.\" It counts.",
      minutes: 4,
      prompt: "What does properly-dosed rest feel like?",
    },
  },
  {
    day: 27,
    theme: "The Long Middle",
    virtue: "courage",
    processTag: "patience",
    morning: {
      title: "Middles Are Unglamorous",
      theory:
        "Beginnings have novelty and endings have results; middles have neither, which is why most efforts die there. Staying loyal through the middle is a distinct form of courage.",
      task: "Acknowledge it plainly: \"This is the middle. It is supposed to feel ordinary.\" Then do the first ordinary task with care.",
      minutes: 2,
      prompt: "Can I be loyal to an ordinary day?",
    },
    midday: {
      title: "Ordinary Excellence",
      theory:
        "Excellence in the middle looks like nothing special: the same drill, done with the same care, on a day with no occasion. That invisibility is exactly what makes it rare.",
      task: "Pick the most routine task on today's list and do it with the care you would give a filmed retest. No one will know. That is the point.",
      minutes: 4,
      prompt: "What did invisible excellence feel like?",
    },
    evening: {
      title: "Middle Review",
      theory:
        "Honoring the unglamorous days in review teaches the mind they matter — because the aggregate of ordinary days is precisely what the twelve-week result is made of.",
      task: "Write one sentence honoring today's most ordinary completed task. Grand language for a small thing, on purpose.",
      minutes: 3,
      prompt: "Which ordinary thing deserves grand language today?",
    },
  },
  {
    day: 28,
    theme: "Decide Like a Coach",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "The Coach's Question",
      theory:
        "Retest week ends with a decision: progress, hold, or deload. A coach makes it from data and observation; a worrier makes it from mood. You get to choose which one decides.",
      task: "Set the frame for the weekly review: \"I decide next week's plan as my own coach.\" List the two or three facts the decision should rest on.",
      minutes: 3,
      prompt: "What facts should my coach weigh?",
    },
    midday: {
      title: "Walk the Evidence",
      theory:
        "Before deciding, a good coach watches the athlete once more with fresh eyes. A short, attentive session today is that final observation.",
      task: "Do one light, familiar task and simply observe quality: smoothness, effort, mood. This is scouting for tonight's decision, not a test.",
      minutes: 4,
      prompt: "What did fresh eyes notice?",
    },
    evening: {
      title: "Week Four Review",
      theory:
        "The first month is complete — a real block of evidence about training, response, and consistency. The decision made tonight, calmly and on evidence, is Stoicism doing its actual job.",
      task: "Make the call in writing: progress, hold, or deload for week five — with the two facts that support it. Then close the review; the decision is made.",
      minutes: 5,
      prompt: "What is my evidence-based call for week five?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 5 — Effort as training (build phase 1: more dynamic work)
// ---------------------------------------------------------------------------

const WEEK_5: StoicDayDef[] = [
  {
    day: 29,
    theme: "Chosen Difficulty",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Choose Before It Chooses",
      theory:
        "There are two kinds of discomfort: the kind that ambushes you and the kind you invite on your own terms. Inviting a measured dose daily builds trust in your capacity to cope.",
      task: "Choose one deliberate difficulty for today from the plan — a heavier set, a longer walk segment, a harder drill — and set its exact size now.",
      minutes: 3,
      prompt: "What difficulty did I choose on my own terms?",
    },
    midday: {
      title: "Meet Your Invitation",
      theory:
        "Showing up to a difficulty you invited is different from enduring one that found you: the posture is host, not hostage. That posture is trainable.",
      task: "Do your chosen difficulty now, as host: welcome it, work through it at a steady tempo, thank it silently, done.",
      minutes: 6,
      prompt: "How did being the host change the effort?",
    },
    evening: {
      title: "Capacity Ledger",
      theory:
        "Every survived, chosen difficulty is a deposit in the account fear checks before it panics. The account grows only when deposits are recorded.",
      task: "Log the deposit: what you invited, that you met it, and one sentence on what it proved about your capacity.",
      minutes: 4,
      prompt: "What did today deposit in my capacity account?",
    },
  },
  {
    day: 30,
    theme: "Effort Is Not a Threat",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Reread the Signal",
      theory:
        "A protective mind can file effort-sensations — heat, heaviness, breath — under danger. Rereading them as signs of training, where safe, is a re-filing job done rep by rep.",
      task: "Before today's session, name the effort-sensations you expect. Label each in advance: \"training signal, not alarm.\"",
      minutes: 3,
      prompt: "Which sensation am I re-filing today?",
    },
    midday: {
      title: "Stay One Breath Longer",
      theory:
        "The moment effort peaks is when the mind proposes stopping. Staying one calm breath past that proposal — within safety — is where the re-filing actually happens.",
      task: "In one safe exercise today, when the urge to stop arrives, stay exactly one steady breath longer, then finish normally.",
      minutes: 5,
      prompt: "What happened in the extra breath?",
    },
    evening: {
      title: "Signal Review",
      theory:
        "Genuine warning signs — the plan's stop rules — deserve obedience. Ordinary effort does not. The evening sorts today's sensations honestly into those two boxes.",
      task: "List the strongest sensations from today's training and sort them: warning (act on it) or effort (welcome it). Note any that changed boxes lately.",
      minutes: 5,
      prompt: "Which sensations are changing boxes?",
    },
  },
  {
    day: 31,
    theme: "The Craftsman's Attitude",
    virtue: "temperance",
    processTag: "attention",
    morning: {
      title: "Work Like a Craftsman",
      theory:
        "A craftsman is absorbed in the work, not in being watched doing the work. Rehab done as craft — attention on grain and detail — is calmer and better than rehab done as ordeal.",
      task: "Pick today's main session and name its craft detail: the exact quality you will work on, like heel placement or breath timing.",
      minutes: 2,
      prompt: "What is today's craft detail?",
    },
    midday: {
      title: "Ten Careful Minutes",
      theory:
        "Craft time moves differently: unhurried, absorbed, precise. Ten minutes of that quality often outweighs thirty minutes of distracted effort.",
      task: "Give ten fully absorbed minutes to your chosen detail. Phone away, one quality, complete attention.",
      minutes: 10,
      prompt: "What did absorption feel like today?",
    },
    evening: {
      title: "Craftsman's Log",
      theory:
        "Craftsmen keep working notes, not confessions: what the material did, what the hands learned, what to try tomorrow. That format keeps review useful and kind.",
      task: "Write today's working note in craftsman format: material, hands, tomorrow. Three short lines.",
      minutes: 4,
      prompt: "What did my hands learn today?",
    },
  },
  {
    day: 32,
    theme: "Steady Under Load",
    virtue: "temperance",
    intensity: "medium",
    processTag: "patience",
    morning: {
      title: "Calm Is a Load Skill",
      theory:
        "Anyone is calm at rest. The training goal is calm at load — steady breath and loose face while the legs work hard. That combination is built, not found.",
      task: "Set today's pairing goal: during the hardest planned set, keep two islands of ease — soft jaw, steady exhale. Name them now.",
      minutes: 2,
      prompt: "What are my two islands of ease?",
    },
    midday: {
      title: "Islands in the Effort",
      theory:
        "Total-body tension is a habit, not a requirement of effort. Keeping selected regions easy while others work teaches the system that load and panic are separable.",
      task: "During today's hardest set or segment, hold your two islands of ease from start to finish. If they flood, pause, restore, continue.",
      minutes: 6,
      prompt: "Did the islands hold under load?",
    },
    evening: {
      title: "Load Response Review",
      theory:
        "The plan watches for delayed flares the day after load. A calm written note tonight — load, response, mood — makes tomorrow's reading accurate instead of anxious.",
      task: "Record tonight: today's load in one line, the body's response in one line, your mood's response in one line. No forecasting.",
      minutes: 4,
      prompt: "How did body and mood each answer the load?",
    },
  },
  {
    day: 33,
    theme: "Boredom Tolerance",
    virtue: "temperance",
    processTag: "consistency",
    morning: {
      title: "Boredom Is Not a Problem",
      theory:
        "By week five, exercises repeat and novelty fades — and the mind may call that a problem. It is not. Boredom is what consistency feels like from inside on some days.",
      task: "Expect boredom today and greet it by name when it arrives: \"this is repetition working.\" Plan no entertainment fix for it.",
      minutes: 2,
      prompt: "Can boredom and good training share a session?",
    },
    midday: {
      title: "Find the Fresh Detail",
      theory:
        "A repeated drill is never actually identical — breath, balance, and control shift subtly every time. Attention to the shifting detail turns repetition into observation.",
      task: "In today's most repetitive task, find one detail that is different from last time. Track it through the whole task.",
      minutes: 4,
      prompt: "What was new inside the repetition?",
    },
    evening: {
      title: "Repetition Review",
      theory:
        "Skills are built by the reps that felt like nothing. Honoring an unremarkable session in review is how the mind learns to keep funding them.",
      task: "Write one sentence of respect for today's plainest completed rep. It carried the program today.",
      minutes: 3,
      prompt: "Which plain rep carried today?",
    },
  },
  {
    day: 34,
    theme: "Speech Under Fatigue",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Plan the Tired Test",
      theory:
        "The plan adds a fatigue condition this phase — speech after light exertion. Meeting a known hard condition on purpose, prepared and calm, is the Stoic Challenge in miniature.",
      task: "Schedule today's harder condition — a short speech sample after a walk, or a fine-motor task when tired — and decide your calm setup for it.",
      minutes: 3,
      prompt: "How will I set up the tired test calmly?",
    },
    midday: {
      title: "Perform Tired, Kindly",
      theory:
        "Function under fatigue is its own skill, trained by attempting it with standards adjusted to conditions. Kind standards under hard conditions is justice, not softness.",
      task: "Do the fatigued task now. Adjust the standard to the condition — slower, shorter is fine — and complete it without commentary.",
      minutes: 5,
      prompt: "What did I manage under fatigue?",
    },
    evening: {
      title: "Condition Review",
      theory:
        "Comparing a fatigued attempt to a fresh attempt is comparing different tests. The honest log records the condition next to the result, always.",
      task: "Log today's harder-condition attempt with its condition attached: \"after 20-min walk\" or \"end of day.\" Note one thing that held up.",
      minutes: 4,
      prompt: "What held up even when tired?",
    },
  },
  {
    day: 35,
    theme: "Week Five Review",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "The Builder's Walkthrough",
      theory:
        "A build-phase week deserves a builder's walkthrough: what got constructed, what needs shoring, what the next pour requires. Practical eyes, not grading eyes.",
      task: "Walk this week mentally in one minute: the chosen difficulties, the craft sessions, the loads. Note what feels most solidly built.",
      minutes: 3,
      prompt: "What did this week actually construct?",
    },
    midday: {
      title: "One Proud Rep",
      theory:
        "Pride, rightly sized, is fuel: not superiority, but the quiet satisfaction of work done as intended. One deliberate rep taken with that feeling banks it.",
      task: "Do one repetition of your best-built movement from this week, purely to feel it done well. Let it be satisfying.",
      minutes: 3,
      prompt: "What does earned satisfaction feel like?",
    },
    evening: {
      title: "Effort Reframed",
      theory:
        "Five weeks ago effort may have read as threat; this week you invited it daily. The review names that shift explicitly, because named shifts stabilize.",
      task: "Write how your relationship to effort has changed since day one — one honest paragraph, including what still feels hard.",
      minutes: 5,
      prompt: "How do I meet effort now versus week one?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 6 — Steadiness without drama (build phase 2: tolerance, no boom-bust)
// ---------------------------------------------------------------------------

const WEEK_6: StoicDayDef[] = [
  {
    day: 36,
    theme: "No Drama Days",
    virtue: "temperance",
    processTag: "consistency",
    morning: {
      title: "Ordinary On Purpose",
      theory:
        "Boom-bust cycles start with a great day treated as the new normal. The Stoic keeps good days ordinary on purpose — same plan, same dose — so they can repeat.",
      task: "Whatever this morning feels like — good or bad — commit to the planned dose, unchanged. Write the dose down before the mood can edit it.",
      minutes: 2,
      prompt: "Did the plan or the mood set today's dose?",
    },
    midday: {
      title: "Flat Line Effort",
      theory:
        "Steadiness means the effort curve stays flat across the session: no heroic starts that borrow from the finish. Even pacing is temperance you can feel.",
      task: "In today's main session, pace deliberately: start at the effort you can hold to the end, and hold it. Notice any urge to spike.",
      minutes: 5,
      prompt: "Where did I want to spike, and did I hold?",
    },
    evening: {
      title: "Repeatable Review",
      theory:
        "The test of a good training day is whether tomorrow-you could repeat it. Days that pass that test compound; days that don't, crash.",
      task: "Ask of today: could I repeat this tomorrow? Write yes or no, and what one change would make it repeatable.",
      minutes: 4,
      prompt: "Was today repeatable?",
    },
  },
  {
    day: 37,
    theme: "The Delayed Echo",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Listen for Yesterday",
      theory:
        "Loads echo a day later — the plan warns about delayed flares. Checking this morning's state against yesterday's load, calmly, is reading the echo without fearing it.",
      task: "Note this morning, in one line each: yesterday's load, today's state on waking. Just the pairing — interpretation belongs to Sunday.",
      minutes: 3,
      prompt: "What is today's echo of yesterday?",
    },
    midday: {
      title: "Adjust One Notch",
      theory:
        "Wisdom adjusts in small increments: one notch down if the echo is loud, one notch up if it is quiet. Big swings in either direction are mood, not management.",
      task: "Based on this morning's echo, adjust today's session by at most one notch — slightly lighter or slightly fuller — and note which and why.",
      minutes: 4,
      prompt: "Which direction was my one notch, and why?",
    },
    evening: {
      title: "Echo Log",
      theory:
        "A month of load-and-echo pairs becomes the pattern map the plan is designed to produce: which loads help, which cost too much. Each calm entry builds the map.",
      task: "Complete today's pair in the log: load taken, echo expected. Tomorrow morning finishes the entry.",
      minutes: 3,
      prompt: "What pattern is the echo map starting to show?",
    },
  },
  {
    day: 38,
    theme: "Equanimity Practice",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "The Even Keel",
      theory:
        "Equanimity is not flatness of feeling; it is a keel — feelings blow through like weather while the boat stays on course. The course today is just the plan.",
      task: "Name this morning's weather honestly — frustrated, hopeful, tired, fine — and then name the course. Confirm they are two different things.",
      minutes: 2,
      prompt: "What was the weather, and what was the course?",
    },
    midday: {
      title: "Sail Through One Squall",
      theory:
        "A squall — a surge of irritation or discouragement mid-task — tests the keel. Continuing the task at unchanged tempo while the feeling passes is the whole practice.",
      task: "When a difficult feeling arrives during today's training, keep tempo unchanged for two more minutes while it moves through. Then reassess freely.",
      minutes: 4,
      prompt: "Did the boat hold course through the squall?",
    },
    evening: {
      title: "Weather Report",
      theory:
        "Reviewing feelings as weather — arrived, peaked, passed — teaches their central secret: they pass. The log makes the passing visible.",
      task: "Write today's strongest feeling as a weather report: when it arrived, how long it stayed, what remained after. Note the course held or lost.",
      minutes: 4,
      prompt: "How long did today's weather actually last?",
    },
  },
  {
    day: 39,
    theme: "Help and Be Helped",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Made For Cooperation",
      theory:
        "Marcus wrote that we are made for cooperation, like hands and eyelids. Rehab done in complete solitude gets heavier than it needs to be; letting people in is justice to yourself.",
      task: "Identify one way another person touches today's rehab — a walk companion, telling someone your plan, asking for one small help — and set it up.",
      minutes: 3,
      prompt: "Who is part of today's training?",
    },
    midday: {
      title: "Receive Without Apology",
      theory:
        "Accepting help gracefully is harder than giving it, and just as virtuous. Apologizing for needing support tells the nervous system that needing support is shameful. It is not.",
      task: "Accept one form of support today — practical or moral — with plain thanks and zero apology. Notice the reflex to apologize, and skip it once.",
      minutes: 3,
      prompt: "Could I receive without apologizing?",
    },
    evening: {
      title: "Connection Review",
      theory:
        "Symptoms shrink in the attention when life includes other people at full presence. The review checks whether today had any moments of that kind.",
      task: "Write one moment today where you were fully with someone — and whether rehab or symptoms stayed politely in the background.",
      minutes: 4,
      prompt: "When was I most with someone today?",
    },
  },
  {
    day: 40,
    theme: "The Halfway Point",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Look Back Down the Trail",
      theory:
        "Day forty is near the program's midpoint. On a long climb, looking back down the trail — not just up at the summit — is how you see distance actually covered.",
      task: "Spend two minutes listing what exists now that did not on day one: habits, logs, reps completed, tools learned. Facts only.",
      minutes: 3,
      prompt: "What exists now that didn't exist on day one?",
    },
    midday: {
      title: "Midpoint Rep",
      theory:
        "The midpoint deserves a marker: one task done today with full ceremony — best attention, best setup — as a monument to forty days of showing up.",
      task: "Choose one task and make it today's monument: unhurried, precise, complete. Dedicate it silently to the forty days behind it.",
      minutes: 5,
      prompt: "What did I build my midpoint monument from?",
    },
    evening: {
      title: "Second Half Intent",
      theory:
        "The second half of any long effort is run on intent, not novelty. Setting that intent in writing tonight gives the remaining weeks their instruction.",
      task: "Write one sentence of intent for the second half of the program. Make it about process — the kind of trainee you will keep being.",
      minutes: 4,
      prompt: "What is my second-half intent?",
    },
  },
  {
    day: 41,
    theme: "Living Normally Anyway",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Life Is Not On Hold",
      theory:
        "One quiet risk of any program is postponing life until it finishes. Stoics refuse the postponement: ordinary life — plans, people, pleasures — continues alongside training.",
      task: "Name one ordinary life thing you have been postponing \"until better\" — an outing, a call, a hobby session — and schedule a scaled version of it.",
      minutes: 3,
      prompt: "What have I been postponing until 'better'?",
    },
    midday: {
      title: "Do the Living",
      theory:
        "Doing a normal thing at partial capacity beats doing nothing at full imagination. Living now, adapted, is the actual goal the training serves.",
      task: "Do your scheduled ordinary thing today, adapted as needed. Let it be about the thing itself, not a test of how you performed in it.",
      minutes: 6,
      prompt: "What was it like to just do the thing?",
    },
    evening: {
      title: "Normal Life Review",
      theory:
        "The plan's own success measure includes living more normally despite symptoms. Tonight's review checks that measure directly, in one honest line.",
      task: "Write: one normal-life thing done today, and whether you were in it or watching yourself from outside it. No penalty either way — just the reading.",
      minutes: 4,
      prompt: "Was I in my life today or observing it?",
    },
  },
  {
    day: 42,
    theme: "Week Six Review",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Steadiness Audit",
      theory:
        "Week six aimed at tolerance without boom-bust. The audit question is simple: how flat was the week's effort curve, and what wobbled it?",
      task: "Sketch the week in your head as a line: spikes, dips, flats. Name the biggest wobble and its trigger in one line each.",
      minutes: 3,
      prompt: "How flat was my week, honestly?",
    },
    midday: {
      title: "Practice the Wobble Fix",
      theory:
        "A named wobble deserves one rehearsal of its fix — today, in miniature, while the memory is fresh. Rehearsed fixes deploy themselves next time.",
      task: "Recreate a small version of this week's wobble trigger and walk through the better response once: pause, breathe, one notch adjustment, continue.",
      minutes: 4,
      prompt: "What is my rehearsed fix for the wobble?",
    },
    evening: {
      title: "Half-Program Gratitude",
      theory:
        "Closing the program's first half with gratitude — to the body that worked, the people who helped, the self that kept showing up — is accurate accounting, not sentiment.",
      task: "Write three thank-yous for the first half: one to your body, one to a person, one to yourself. Specific, one line each.",
      minutes: 5,
      prompt: "Who and what carried the first half?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 7 — Attention under complexity (dual-task phase)
// ---------------------------------------------------------------------------

const WEEK_7: StoicDayDef[] = [
  {
    day: 43,
    theme: "Divided Attention, Whole Calm",
    virtue: "wisdom",
    intensity: "medium",
    processTag: "attention",
    morning: {
      title: "Complexity Is the Curriculum",
      theory:
        "This phase adds dual-task work — counting while stepping, talking while walking. The mind may read complexity as risk; the truer frame is curriculum: attention is being stretched on purpose.",
      task: "Before today's session, name the planned complexity and file it as curriculum: \"attention training, prescribed dose.\"",
      minutes: 2,
      prompt: "What is today's attention curriculum?",
    },
    midday: {
      title: "One Anchor Under Load",
      theory:
        "In dual-task work, calm survives through a single anchor — usually the breath — that keeps running under everything else. One anchor, lightly held, beats five controls gripped hard.",
      task: "During today's dual-task drill, hold one light anchor (breath rhythm) and let everything else be imperfect. Finish the drill anchored.",
      minutes: 5,
      prompt: "Did the anchor hold while attention divided?",
    },
    evening: {
      title: "Complexity Review",
      theory:
        "Dual-task performance dips before it improves — that dip is the system learning, not failing. The review names the dip as expected, which defuses it.",
      task: "Write how the complexity actually went — including the messy parts — and add the sentence: \"the dip is the curriculum working.\"",
      minutes: 4,
      prompt: "Can I let performance dip while learning?",
    },
  },
  {
    day: 44,
    theme: "Interruption Training",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Plans Meet Reality",
      theory:
        "Epictetus reminded sailors that the wind, not the sailor, decides the wind. Interruptions to today's plan are certain; what is trainable is the cost of each interruption.",
      task: "Accept in advance: today's plan will be interrupted somewhere. Decide the standard response now — note it, breathe, resume where possible.",
      minutes: 2,
      prompt: "What is my standard response to interruption?",
    },
    midday: {
      title: "The Cheap Restart",
      theory:
        "The expensive part of an interruption is not the pause; it is the drama about the pause. A cheap restart — no sighing, no penalty lap, just resume — keeps the day intact.",
      task: "When today's session gets interrupted or fragmented, practice the cheap restart: resume at the exact point, zero commentary. Count your restarts as reps.",
      minutes: 4,
      prompt: "How cheap were my restarts today?",
    },
    evening: {
      title: "Interruption Ledger",
      theory:
        "Days rarely fail from interruptions; they fail from abandonments after interruptions. The ledger distinguishes the two, and today's evidence usually flatters you.",
      task: "Count today's interruptions and today's abandonments separately. Note the gap between the numbers — that gap is resilience.",
      minutes: 4,
      prompt: "Interruptions versus abandonments — what is my ratio?",
    },
  },
  {
    day: 45,
    theme: "Speaking Under Pressure",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "The Listener Is Not a Judge",
      theory:
        "Speech practice this phase moves toward conversation — where a listener waits. The mind casts listeners as judges; almost all are simply people, mildly interested, mostly kind.",
      task: "Plan one real speaking moment today — a call, an errand conversation, reading to someone. Recast the listener in advance: person, not judge.",
      minutes: 3,
      prompt: "Who is my listener today, really?",
    },
    midday: {
      title: "Say It Anyway",
      theory:
        "Fluency grows through tolerated imperfection in real use, not through waiting for perfect conditions. One real conversation, effortful but done, is the day's true rep.",
      task: "Have your planned speaking moment now. Let pace be slow, let words be imperfect, and stay until the exchange completes naturally.",
      minutes: 5,
      prompt: "What did I say today despite the effort?",
    },
    evening: {
      title: "Voice Review",
      theory:
        "Review the exchange by its content — what was communicated, what connected — before its mechanics. Content-first review keeps speech attached to its purpose: reaching people.",
      task: "Write what the conversation was about and what got through, first. Only then one mechanical note, if useful.",
      minutes: 4,
      prompt: "What reached the other person today?",
    },
  },
  {
    day: 46,
    theme: "The Inner Citadel",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Visit the Citadel",
      theory:
        "Marcus called it the inner citadel: the place in you that observes and chooses, which no symptom or setback has ever entered. Visiting it briefly each morning proves it is still there.",
      task: "Sit for two minutes. Behind sensations, behind today's forecast, notice the one who observes and chooses. Start the day from there.",
      minutes: 3,
      prompt: "What remains untouched in me regardless of the day?",
    },
    midday: {
      title: "Retreat and Return",
      theory:
        "Mid-difficulty, the citadel is one breath away: a single deliberate withdrawal to the observing place, then a return to action with the chooser in charge.",
      task: "Once today, mid-task, take the one-breath retreat: observe the moment from the citadel, choose the next action, return and do it.",
      minutes: 3,
      prompt: "What did the citadel view change mid-task?",
    },
    evening: {
      title: "Citadel Review",
      theory:
        "The evening confirms the day's core fact: whatever the body did, the observer-chooser was present and functioning throughout. That continuity is the deepest steadiness available.",
      task: "Write one line about a moment today when you acted from the chooser rather than the reaction. That line is the day's headline.",
      minutes: 4,
      prompt: "When was the chooser clearly in charge today?",
    },
  },
  {
    day: 47,
    theme: "Precision Under Time",
    virtue: "temperance",
    intensity: "medium",
    processTag: "attention",
    morning: {
      title: "Pressure Is a Setting",
      theory:
        "Light time pressure on precision tasks is this phase's tool. Pressure is a setting you dial, not weather that happens: today you set the dial yourself, one notch only.",
      task: "Choose one precision task — typing, buttons, coins — and set a gentle time frame for it: enough to feel the clock, not enough to panic.",
      minutes: 2,
      prompt: "What is my one-notch pressure setting today?",
    },
    midday: {
      title: "Smooth Beats Fast",
      theory:
        "Under a clock, the winning strategy is unchanged: smoothness first, speed as a byproduct. Rushing spends coordination to buy time and gets a bad exchange rate.",
      task: "Do the timed task prioritizing smoothness. If the clock and smoothness conflict, let the clock lose, and note that choosing that was the exercise.",
      minutes: 5,
      prompt: "Did smoothness survive the clock?",
    },
    evening: {
      title: "Pressure Review",
      theory:
        "Reviewing timed work checks the response, not the time: did pressure sharpen attention or scatter it? The answer calibrates next week's dial.",
      task: "Write what the clock did to your attention today — sharpened, scattered, or both in phases — and what dial setting tomorrow deserves.",
      minutes: 4,
      prompt: "What does light pressure do to my attention?",
    },
  },
  {
    day: 48,
    theme: "Judgments About Judgments",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "It Is the Opinion",
      theory:
        "Epictetus taught that people are disturbed not by things but by their opinions about things. Today's practice is spotting the opinion layer riding on top of plain events.",
      task: "Take one recurring difficulty and write it twice: once as a bare event, once with your usual opinion attached. See the two clearly before starting the day.",
      minutes: 3,
      prompt: "What does the bare event look like without my opinion?",
    },
    midday: {
      title: "Strip One Opinion",
      theory:
        "Mid-task, opinions arrive as instant captions: \"this is going badly.\" Deleting the caption — returning to the bare footage — is done in one breath and changes the scene.",
      task: "Catch one caption today during training. Strip it to the bare event, and continue working with the footage instead of the caption.",
      minutes: 3,
      prompt: "What caption did I strip today?",
    },
    evening: {
      title: "Caption Review",
      theory:
        "The evening collects the day's most expensive caption — the opinion that cost the most calm — and drafts its cheaper replacement for next time.",
      task: "Write today's most expensive caption, its cost, and a caption that would have been accurate and cheaper. Keep the replacement.",
      minutes: 5,
      prompt: "Which opinion cost me most today?",
    },
  },
  {
    day: 49,
    theme: "Week Seven Review",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Attention Inventory",
      theory:
        "Week seven stretched attention across dual tasks, interruptions, pressure, and captions. The inventory asks which stretch produced the most growth per unit of difficulty.",
      task: "Rank this week's attention challenges from most to least useful for you personally. One minute, gut ranking, noted down.",
      minutes: 3,
      prompt: "Which attention stretch served me most?",
    },
    midday: {
      title: "Repeat the Winner",
      theory:
        "The highest-ranked exercise earns a same-day repeat — reinforcement while the skill is warm is the cheapest gains available.",
      task: "Repeat a small version of your top-ranked attention exercise from the week, once, now-ish. Bank the rep.",
      minutes: 4,
      prompt: "What did the repeat consolidate?",
    },
    evening: {
      title: "Pre-Retest Framing",
      theory:
        "Week eight is the second retest. Framing it tonight — measurement, ritual, one honest take, three fair columns — installs the calm before the week begins.",
      task: "Write your retest-week intention in two sentences, borrowing whatever worked from week four. Post it where Monday-you will read it.",
      minutes: 4,
      prompt: "How will I meet retest week this time?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 8 — Retest week: honest review (second retest; clinician summary prep)
// ---------------------------------------------------------------------------

const WEEK_8: StoicDayDef[] = [
  {
    day: 50,
    theme: "Second Sitting",
    virtue: "temperance",
    processTag: "consistency",
    morning: {
      title: "Familiar Ground",
      theory:
        "This retest is familiar ground — the ritual is known, the protocol rehearsed. Familiarity is an asset: the second sitting of any exam is calmer if you let it be.",
      task: "Set up this week's first retest task using week four's ritual notes. Let the familiarity itself be the calming agent.",
      minutes: 3,
      prompt: "What is calmer this retest than last?",
    },
    midday: {
      title: "Test Day Ordinary",
      theory:
        "Peak performers make test day feel like practice by making practice feel like test day. You have eight weeks of practice; today is just another one with a camera present.",
      task: "Do today's measured task at practice-day arousal: normal warm-up, normal pace, ordinary breathing. The camera is furniture.",
      minutes: 5,
      prompt: "Did test day stay ordinary?",
    },
    evening: {
      title: "First Data In",
      theory:
        "Early results tempt early conclusions. The disciplined move is filing today's data unread until the week's set is complete — conclusions from full sets only.",
      task: "File today's results without interpreting them. Write only: \"collected, filed, week continues.\" Interpretation has an appointment on Sunday.",
      minutes: 3,
      prompt: "Can I file without reading meaning yet?",
    },
  },
  {
    day: 51,
    theme: "What Improved, Unchanged, Worse",
    virtue: "justice",
    processTag: "attention",
    morning: {
      title: "Three Honest Columns",
      theory:
        "The plan's own format for week eight is improved, unchanged, worse. All three columns filled honestly is the deliverable — a summary a clinician can actually use.",
      task: "Prepare the three-column page today. Commit in advance: every column gets at least one honest entry by Sunday, whatever the entries are.",
      minutes: 3,
      prompt: "Am I ready to fill all three columns?",
    },
    midday: {
      title: "The Unchanged Column",
      theory:
        "\"Unchanged\" is the column egos skip — too dull for hope, too mild for fear. But unchanged under eight weeks of load often means held, and held is information.",
      task: "During today's tasks, notice one function that is simply unchanged since week four. Enter it in its column with the respect it earns.",
      minutes: 3,
      prompt: "What does 'unchanged' actually mean in my case?",
    },
    evening: {
      title: "Column Review",
      theory:
        "An entry in the \"worse\" column is a task for the plan, not a wound for the self: it feeds the deload rules and the clinician conversation. That is the column doing its job.",
      task: "If anything belongs in \"worse\" so far, write it plainly plus the plan-rule it triggers. If nothing does, write that plainly too.",
      minutes: 5,
      prompt: "Can the 'worse' column be useful instead of frightening?",
    },
  },
  {
    day: 52,
    theme: "The Clinician's Reader",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Write For a Stranger",
      theory:
        "The week-eight summary will be read by clinicians who need signal, not mood. Writing for that reader — concrete, dated, brief — is a Stoic exercise in seeing your own case from outside.",
      task: "Draft two lines of your summary as if describing a stranger's case: function, change, context. Notice how the outside view sounds.",
      minutes: 4,
      prompt: "How does my case read from outside?",
    },
    midday: {
      title: "Evidence Walk",
      theory:
        "Good summaries stand on specifics: this task, this date, this difference. A brief session today collecting one concrete example is worth a page of impressions.",
      task: "Pick one function and produce its concrete example today: the specific task, the observable difference from week zero, one sentence total.",
      minutes: 4,
      prompt: "What is my single most concrete example of change?",
    },
    evening: {
      title: "Question List Review",
      theory:
        "The plan keeps clinician questions ready — SEP findings, imaging, referrals. Reviewing them calmly tonight turns future appointments from ordeals into agendas.",
      task: "Read through your open clinician questions once. Mark the single most important one and note what this month's data adds to it.",
      minutes: 5,
      prompt: "What is my most important open question, and what feeds it?",
    },
  },
  {
    day: 53,
    theme: "Neither Inflate Nor Deflate",
    virtue: "justice",
    processTag: "attention",
    morning: {
      title: "The Two Distortions",
      theory:
        "Reviews get corrupted two ways: inflating progress to feel safe, deflating it to feel prepared. Both are comfort strategies wearing the mask of accuracy. Naming yours disarms it.",
      task: "Name your habitual distortion — inflator or deflator — from honest self-knowledge. Set today's guard against that one specifically.",
      minutes: 3,
      prompt: "Which distortion is mine, inflating or deflating?",
    },
    midday: {
      title: "The Accurate Middle",
      theory:
        "Accuracy usually lives in duller language than either distortion: \"somewhat smoother, still effortful.\" Practicing that mid-toned language is practicing the truth.",
      task: "Describe one of today's tasks aloud or on paper in deliberately mid-toned words: no triumph, no doom, just the accurate middle.",
      minutes: 3,
      prompt: "What does my accurate middle voice sound like?",
    },
    evening: {
      title: "Distortion Audit",
      theory:
        "Tonight's audit rereads any entries made this week hunting for the named distortion — one honest correction now protects the whole summary's value.",
      task: "Reread this week's notes once. Correct one line that shows your distortion, replacing it with the accurate middle version.",
      minutes: 5,
      prompt: "Did my distortion get into the record, and did I catch it?",
    },
  },
  {
    day: 54,
    theme: "Progress Includes Response",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "The Second Scoreboard",
      theory:
        "Function is one scoreboard; response is the other — complaints, checking habits, bad-day behavior, normal living. Eight weeks of Stoic practice should show somewhere on the second board.",
      task: "Rate yourself this morning on the second board, one line each: complaining, checking, bad-day response, living normally. Compared to week zero, from memory.",
      minutes: 4,
      prompt: "What does my response scoreboard show at week eight?",
    },
    midday: {
      title: "Response In Action",
      theory:
        "The scoreboard is only as real as today's behavior. One deliberate demonstration — a difficulty met with the trained response — turns the rating into evidence.",
      task: "At today's first difficulty, run the full trained response deliberately: notice, breathe, one useful action, no commentary. Log that it ran.",
      minutes: 3,
      prompt: "Did the trained response run when called?",
    },
    evening: {
      title: "Character Data",
      theory:
        "Changes in response are as reportable as changes in function — and often precede them. Tonight they go in the record with the same seriousness as any timing or count.",
      task: "Add a response-change entry to your week-eight summary: the clearest behavioral difference between week-zero-you and today-you.",
      minutes: 4,
      prompt: "What is the clearest change in how I respond?",
    },
  },
  {
    day: 55,
    theme: "Deload Wisdom",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Moderate By Design",
      theory:
        "Week eight prescribes moderate training and no maximal push. Obeying a prescription for less — while feeling capable of more — is temperance at its most concrete.",
      task: "Confirm today's session is genuinely moderate: check it against the plan, trim anything that crept upward, and proceed without renegotiating.",
      minutes: 2,
      prompt: "Did I let moderate be moderate?",
    },
    midday: {
      title: "Spare Capacity",
      theory:
        "Finishing with fuel in the tank feels wrong to enthusiasm and right to physiology. The spare capacity is not wasted — it is what adaptation is built from.",
      task: "End today's session clearly before empty. Name the remaining capacity out loud — \"I had more\" — and leave with it intact.",
      minutes: 3,
      prompt: "What does finishing with reserve feel like?",
    },
    evening: {
      title: "Restraint Review",
      theory:
        "A restraint kept is logged like a lift completed — it was the day's assignment, and it was done. The log entry cements restraint as achievement rather than absence.",
      task: "Log today's restraint as the accomplishment it was: what you could have pushed, that you didn't, and why the plan is served by it.",
      minutes: 4,
      prompt: "What did restraint accomplish today?",
    },
  },
  {
    day: 56,
    theme: "Week Eight Review",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Assemble the Summary",
      theory:
        "Today the week's pieces assemble: three columns, concrete examples, response changes, open questions. Assembly is mechanical if the pieces were made honestly — and they were.",
      task: "Gather this week's notes into the summary skeleton this morning: columns filled, examples attached, questions listed. Thirty minutes of calm clerical work.",
      minutes: 5,
      prompt: "Is the summary assembled and honest?",
    },
    midday: {
      title: "Read It As the Coach",
      theory:
        "The finished summary gets one reading in the coach's chair: what does this evidence say about the next four weeks — progress, hold, or shift of emphasis?",
      task: "Read your summary once, as coach. Write the week-nine decision it supports and the single strongest fact behind that decision.",
      minutes: 4,
      prompt: "What do eight weeks of evidence recommend?",
    },
    evening: {
      title: "Two-Thirds Gate",
      theory:
        "Two-thirds of the program stands behind you. The gate ritual: acknowledge the distance, thank the discipline that covered it, and set one sentence of intent for the final third.",
      task: "Write the gate entry: distance acknowledged in one line, discipline thanked in one line, final-third intent in one line.",
      minutes: 4,
      prompt: "What is my intent for the final third?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 9 — Courage in real life (sport-specific: football, running, world)
// ---------------------------------------------------------------------------

const WEEK_9: StoicDayDef[] = [
  {
    day: 57,
    theme: "The Field Is the Gym Now",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Bridge to the Real",
      theory:
        "This phase bridges rehab to real life: football touches, continuous running, real stairs in real places. The drills were rehearsal; the world is the venue. Same calm, new address.",
      task: "Name today's real-world venue — the pitch, the park loop, the office stairs — and the one trained behavior you are taking there.",
      minutes: 3,
      prompt: "What trained behavior travels to the real world today?",
    },
    midday: {
      title: "Play, Don't Perform",
      theory:
        "Sport-specific work succeeds when it becomes play again — absorbed in the ball, the route, the rhythm — rather than a performance of recovery being watched from inside.",
      task: "During today's sport or cardio block, aim for one stretch of genuine absorption in the activity itself. When self-watching starts, return to the ball or the road.",
      minutes: 6,
      prompt: "Did play show up today, even briefly?",
    },
    evening: {
      title: "Venue Review",
      theory:
        "Skills proven in the world count double in confidence terms. The review records what transferred cleanly and what still prefers the practice room — both useful maps.",
      task: "Write what transferred to the real venue today and what didn't yet. No verdicts — transfer schedules differ per skill.",
      minutes: 4,
      prompt: "What transferred, and what needs more rehearsal?",
    },
  },
  {
    day: 58,
    theme: "Watched and Unbothered",
    virtue: "courage",
    intensity: "medium",
    processTag: "courage",
    morning: {
      title: "Other People's Eyes",
      theory:
        "Real venues include real people, and the mind inflates their attention a hundredfold. Most passersby are absorbed in their own days; the audience is mostly imaginary.",
      task: "If today's training happens where people are, pre-shrink the audience: estimate honestly how many seconds any stranger will think about you. Write the number.",
      minutes: 2,
      prompt: "How big is the real audience, honestly?",
    },
    midday: {
      title: "Train in Public",
      theory:
        "Doing the work where you can be seen — walking your route, playing your touches, speaking your orders — while staying task-focused is social courage in its plainest form.",
      task: "Do one training element in a public or semi-public setting today, attention on the task. If self-consciousness rises, note it and give the task one more minute.",
      minutes: 5,
      prompt: "What was I able to do while visible?",
    },
    evening: {
      title: "Audience Review",
      theory:
        "Compare tonight: the audience the mind predicted versus the attention actually received. The gap between the two is where social freedom lives.",
      task: "Write predicted audience versus actual attention for today's public moment. Note what the gap suggests for tomorrow.",
      minutes: 4,
      prompt: "What did the imaginary audience cost me, if anything?",
    },
  },
  {
    day: 59,
    theme: "Setback Protocol",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Prepare the Protocol",
      theory:
        "Real-world training brings real-world stumbles — a rough touch, a heavy-legged run. A pre-written protocol beats improvised disappointment: assess, breathe, scale, continue or stop by rule.",
      task: "Write your four-step setback protocol on one line where you will see it. Rehearse it once mentally against a plausible stumble.",
      minutes: 3,
      prompt: "What is my four-step setback protocol?",
    },
    midday: {
      title: "Run the Protocol Live",
      theory:
        "Protocols earn trust by being used on small things first. Today's minor friction — any flub or heaviness — is a live drill for the protocol at low stakes.",
      task: "At today's first stumble, however minor, run the protocol explicitly, step by step. Log that it ran, whatever the outcome.",
      minutes: 4,
      prompt: "Did the protocol run, and how did it feel?",
    },
    evening: {
      title: "Protocol Review",
      theory:
        "After a live run, protocols get refined, not judged: which step held, which needs rewording, what triggers it earlier next time.",
      task: "Refine one step of your setback protocol based on today. Rewrite the improved line into tomorrow's note.",
      minutes: 4,
      prompt: "How does version two of my protocol read?",
    },
  },
  {
    day: 60,
    theme: "Meaningful Tasks First",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Train What You Love",
      theory:
        "The plan turns hand work toward personally meaningful tasks now — typing, guitar, buttons that matter. Training what you love is justice to your own life, not indulgence.",
      task: "Choose the meaningful task for today's fine-motor block — the one connected to who you are, not just what is measured. Set it up with some care.",
      minutes: 3,
      prompt: "Which task connects training to my actual life?",
    },
    midday: {
      title: "The Loving Rep",
      theory:
        "Practicing a meaningful task carries feeling — sometimes frustration at the gap, sometimes joy at the contact. Both belong; the Stoic makes room for both and keeps playing.",
      task: "Do your meaningful task now. When feeling arrives — either kind — give it a nod and give the task the next minute.",
      minutes: 6,
      prompt: "What feeling came with the meaningful work?",
    },
    evening: {
      title: "Meaning Review",
      theory:
        "Meaningful practice sustains programs long after discipline alone tires. The review strengthens the link: this training serves that life, in these visible ways.",
      task: "Write one line connecting today's practice to the life it serves: \"I train X so that Y.\" Make Y specific and yours.",
      minutes: 4,
      prompt: "What is my X-so-that-Y tonight?",
    },
  },
  {
    day: 61,
    theme: "Bad Day Protocol",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "If Today Is Heavy",
      theory:
        "Some days arrive heavy — sleep was poor, the body is loud. The plan has rules for this: reduce, don't abandon. The Stoic addition: reduce without narrating catastrophe.",
      task: "Check this morning honestly against the plan's load rules. If today is a reduce day, set the reduced version now, in plain words, no story attached.",
      minutes: 3,
      prompt: "Is today full, reduced, or rest — by the rules?",
    },
    midday: {
      title: "The Dignified Minimum",
      theory:
        "On heavy days the minimum done with dignity — full attention, no self-pity — outranks the full session done with resentment. Dignity is the variable you always control.",
      task: "Do today's session — full or reduced — with deliberate dignity: set up properly, breathe, complete, close. Ceremony sized to a small thing.",
      minutes: 5,
      prompt: "Did dignity survive the day's weight?",
    },
    evening: {
      title: "Heavy Day Review",
      theory:
        "How you behave on bad days is one of the plan's own success measures. A heavy day handled by the rules, with dignity, is a plus in that column — whatever the body did.",
      task: "If today was heavy: log what the rules said, what you did, and one sentence of credit for the handling. If it wasn't: log the protocol as ready.",
      minutes: 4,
      prompt: "How did I behave when it was hard?",
    },
  },
  {
    day: 62,
    theme: "Momentum Without Greed",
    virtue: "temperance",
    intensity: "medium",
    processTag: "patience",
    morning: {
      title: "Good Weeks Tempt",
      theory:
        "When real-world work goes well, greed whispers: double it, chase it, cash in now. Week nine still runs on the one-variable rule — momentum is protected by refusing to spend it all.",
      task: "Identify what is going well right now and the temptation attached to it. Recommit to this week's single progression variable, and name it.",
      minutes: 2,
      prompt: "What is my one variable this week?",
    },
    midday: {
      title: "Bank, Don't Bet",
      theory:
        "Today's session banks the gain by repeating it cleanly at the same level — not betting it on a bigger version. Repetition at level is how gains become property.",
      task: "Repeat your best current real-world element at exactly its current level, cleanly, once. Resist the upgrade until the week says so.",
      minutes: 5,
      prompt: "Did I bank today or bet today?",
    },
    evening: {
      title: "Greed Review",
      theory:
        "The review checks the ledger: any place the day quietly added variables — more distance and more speed and less rest? Caught tonight, it costs nothing.",
      task: "Audit today for stacked variables. If found, name which one stays for the week and which returns to the queue.",
      minutes: 4,
      prompt: "Did any extra variable sneak in today?",
    },
  },
  {
    day: 63,
    theme: "Week Nine Review",
    virtue: "courage",
    processTag: "courage",
    morning: {
      title: "Courage Inventory",
      theory:
        "Week nine asked for courage in venues: public space, real play, meaningful tasks, heavy days. The inventory lists where courage actually showed — usually more places than the memory offers first.",
      task: "List this week's acts of courage, small ones included — every approach, every public rep, every dignified minimum. Aim for at least five.",
      minutes: 4,
      prompt: "Where did courage actually show up this week?",
    },
    midday: {
      title: "The Confidence Rep",
      theory:
        "Confidence is memory of handled difficulty, made available. One deliberate rep of this week's best-handled challenge files the memory where the body can find it.",
      task: "Repeat, in miniature, the week's best-handled challenge — one flight, one touch sequence, one exchange. Let it feel as handled as it is.",
      minutes: 4,
      prompt: "What does handled feel like in the body?",
    },
    evening: {
      title: "Real Life Report",
      theory:
        "The week closes with the measure that matters most here: is life getting larger? Venues entered, tasks reclaimed, people met — the report is about territory, not symptoms.",
      task: "Write this week's territory report: one venue, task, or moment that is part of life again. Then one candidate territory for week ten.",
      minutes: 5,
      prompt: "Is my life getting larger?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 10 — Natural movement, quiet mind (integration; less monitoring)
// ---------------------------------------------------------------------------

const WEEK_10: StoicDayDef[] = [
  {
    day: 64,
    theme: "Trust the Training",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Let the System Work",
      theory:
        "Ten weeks of training live in your system now. This phase practices trusting it: less supervising of every movement, more letting trained patterns run themselves.",
      task: "Choose one well-drilled movement for today and assign it trust status: you will start it, then let it run without supervision.",
      minutes: 2,
      prompt: "Which movement has earned trust status?",
    },
    midday: {
      title: "Hands Off the Wheel",
      theory:
        "Over-monitoring a trained movement is like grabbing the wheel from a competent driver — it adds wobble. Attention goes to the destination; the driving handles itself.",
      task: "Do your trusted movement with attention on the goal — where you're walking to, what you're typing — not on the mechanics. Note any wobble from letting go, and let go again.",
      minutes: 5,
      prompt: "What happened when I stopped supervising?",
    },
    evening: {
      title: "Trust Review",
      theory:
        "Trust extends one movement at a time, on evidence. Tonight's entry records how unsupervised movement went and nominates the next candidate for trust status.",
      task: "Log today's trust experiment plainly. Nominate tomorrow's second trusted movement if today's evidence supports it.",
      minutes: 4,
      prompt: "What does the trust evidence say?",
    },
  },
  {
    day: 65,
    theme: "Checking Fast",
    virtue: "temperance",
    processTag: "attention",
    morning: {
      title: "A Fast From Checking",
      theory:
        "Symptom-checking is a habit loop that Stoics would recognize as self-inflicted disturbance. A bounded fast — hours, not forever — shows the loop is optional.",
      task: "Declare today's checking fast: pick a window of several hours in which body-status checks are off the menu. Note your usual check triggers so you recognize them.",
      minutes: 3,
      prompt: "What are my checking triggers?",
    },
    midday: {
      title: "Redirect at the Door",
      theory:
        "Each checking urge caught at the door and redirected to the task at hand is one loop weakened. The redirection is gentle — a tap, not a fight.",
      task: "Inside your fast window, each time a check knocks, redirect to whatever your hands or feet are doing. Count redirects like reps.",
      minutes: 4,
      prompt: "How many redirects did the fast produce?",
    },
    evening: {
      title: "Fast Review",
      theory:
        "The plan itself asks whether checking habits make things worse. Tonight's data point: what did hours of not-checking change — in mood, in function, in the loudness of the body?",
      task: "Write what the fast window was like compared to a normal window. One honest paragraph for the pattern map.",
      minutes: 5,
      prompt: "What does less checking actually do for me?",
    },
  },
  {
    day: 66,
    theme: "Rhythm and Flow",
    virtue: "temperance",
    intensity: "medium",
    processTag: "attention",
    morning: {
      title: "Set a Beat",
      theory:
        "Rhythm is a back door past over-control: a metronome, a cadence, a song tempo gives movement an external clock that self-consciousness cannot easily interrupt.",
      task: "Choose today's rhythm tool — metronome footwork from the plan, a cadence for walking, a tempo for taps — and set the beat before the session.",
      minutes: 2,
      prompt: "What beat carries today's movement?",
    },
    midday: {
      title: "Ride the Beat",
      theory:
        "When movement locks onto a rhythm, monitoring quiets on its own — attention is occupied by the beat. Flow is not forced; it is invited by structure like this.",
      task: "Do one rhythmic block: footwork, walking, or tapping locked to your beat. When the mind drifts to evaluation, ride back to the beat.",
      minutes: 6,
      prompt: "Did the beat quiet the monitor?",
    },
    evening: {
      title: "Flow Review",
      theory:
        "Moments of flow — absorbed, smooth, unwatched — are worth marking because they are previews: this is what integrated movement will increasingly feel like.",
      task: "Describe today's closest brush with flow, however brief: what invited it, what ended it. File it as a preview, not a fluke.",
      minutes: 4,
      prompt: "What invited flow today?",
    },
  },
  {
    day: 67,
    theme: "The Body as Ally",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "End the Adversary Story",
      theory:
        "Ten weeks in, the working relationship deserves renegotiation: the body has shown up to every session, adapted to load, carried you to venues. That is an ally's record, not an enemy's.",
      task: "Reread yesterday's or this week's log as the body's performance review — written by a fair manager. Note two things it did well.",
      minutes: 3,
      prompt: "What does the body's performance review say?",
    },
    midday: {
      title: "Work With, Not On",
      theory:
        "Training with an ally feels different from correcting a defect: cooperative, responsive, two parties solving a problem. That stance is available mid-session, any session.",
      task: "Run today's session in with-mode: check in, adjust cooperatively, thank at the end. Same exercises, different relationship.",
      minutes: 5,
      prompt: "How does with-mode training differ?",
    },
    evening: {
      title: "Alliance Review",
      theory:
        "Alliances strengthen through acknowledgment. The evening entry credits the body's contribution today in the same tone you'd credit a teammate who played well.",
      task: "Write the teammate credit: what the body handled today, in appreciative plain language. One or two lines.",
      minutes: 3,
      prompt: "What did my teammate handle today?",
    },
  },
  {
    day: 68,
    theme: "Effortless Standards",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Raise the Floor Quietly",
      theory:
        "Progress at this stage often looks like raised floors, not raised ceilings: the ordinary walk is smoother, the default typing steadier. Noticing floors is a trained skill.",
      task: "Pick one everyday function and observe its current floor today — the quality it has when you're not trying. Just observe; no test conditions.",
      minutes: 2,
      prompt: "Where has my floor quietly risen?",
    },
    midday: {
      title: "The Untried Rep",
      theory:
        "The most honest measure of integration is the rep you didn't prepare for: the stair taken while talking, the cap opened while thinking of dinner. Catch one today, after it happens.",
      task: "Sometime today, catch one function that just happened — done before you thought to manage it. Note it right afterward.",
      minutes: 3,
      prompt: "What did I do today before I could worry about it?",
    },
    evening: {
      title: "Floor Review",
      theory:
        "Raised floors compound silently and get zero celebration unless the review provides it. Tonight it provides it — floors are the deepest kind of progress.",
      task: "Log the floor observation and the untried rep from today, side by side. Add one line: what these suggest about integration.",
      minutes: 4,
      prompt: "What do my floors say that tests don't?",
    },
  },
  {
    day: 69,
    theme: "Carrying It Lightly",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Not a Full-Time Job",
      theory:
        "There is a version of dedication that makes rehab a heavy identity worn all day. The lighter carry — serious inside sessions, set down between them — trains better and lives better.",
      task: "Design today with clear session boundaries: training gets full weight inside its windows, and gets set down completely outside them. Mark the windows.",
      minutes: 3,
      prompt: "Where are today's set-down points?",
    },
    midday: {
      title: "Set It Down",
      theory:
        "Setting the project down between sessions is itself a skill: finishing a block, closing it with a breath, and walking into the next hour as a person, not a patient.",
      task: "After today's main session, perform the set-down: one closing breath, one sentence — \"done for now\" — and full attention to whatever life is next.",
      minutes: 2,
      prompt: "Did I manage to set it down?",
    },
    evening: {
      title: "Lightness Review",
      theory:
        "The review asks a weight question: how heavy was the project today, carried across the whole day? Lighter carrying is progress the plan's normal-life measure will register.",
      task: "Rate today's carry weight honestly — heavy, medium, light — and note what made it lighter or heavier. One observation for tomorrow.",
      minutes: 4,
      prompt: "How heavy was the project today?",
    },
  },
  {
    day: 70,
    theme: "Week Ten Review",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Integration Inventory",
      theory:
        "Week ten worked on trust, less checking, rhythm, alliance, floors, and lightness. The inventory asks which integration is furthest along and which needs the last two weeks' attention.",
      task: "Rank the week's six integration themes by how natural each feels now. Note the top one and the bottom one.",
      minutes: 3,
      prompt: "What integrated most, and what least?",
    },
    midday: {
      title: "Strengthen the Weakest",
      theory:
        "The weakest integration gets a focused rep while there is program left to train it — a targeted ten minutes today is worth an unfocused hour in week twelve.",
      task: "Give ten minutes now to your bottom-ranked theme: another trust rep, another fast window, another rhythm block. Just that one.",
      minutes: 10,
      prompt: "What did the focused rep move?",
    },
    evening: {
      title: "Pre-Consolidation Note",
      theory:
        "Week eleven consolidates: fewer novelties, best exercises only, stabilizing gains. Tonight's note chooses what deserves a place in the keep-pile — the practices that earned it.",
      task: "Draft the keep-pile: the five practices (physical and Stoic) that have earned week-eleven slots. One line of reason each.",
      minutes: 5,
      prompt: "What earned its place in the keep-pile?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 11 — Consolidation: keep what works (reduce novelty, stabilize)
// ---------------------------------------------------------------------------

const WEEK_11: StoicDayDef[] = [
  {
    day: 71,
    theme: "The Keep-Pile",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Fewer Things, Fully",
      theory:
        "Consolidation week runs on a Stoic principle: better to do a few essential things completely than many things thinly. The keep-pile from Sunday is now the whole curriculum.",
      task: "Post your keep-pile list where today's training happens. Everything on it gets done fully; everything off it waits without guilt.",
      minutes: 2,
      prompt: "Can I let the keep-pile be enough?",
    },
    midday: {
      title: "Full Version Only",
      theory:
        "With fewer exercises, each gets its full version: complete warm-up, complete attention, complete finish. Depth is what consolidation means physically.",
      task: "Do one keep-pile exercise at absolutely full quality today — nothing rushed, nothing skipped, the definitive version of it.",
      minutes: 6,
      prompt: "What does the definitive version feel like?",
    },
    evening: {
      title: "Depth Review",
      theory:
        "The review compares textures: this week's few-things-fully against earlier many-things-thinly. Most people find depth trains calm as effectively as it trains function.",
      task: "Write one line on the texture of today's deeper practice versus the busier weeks. Which serves you more right now?",
      minutes: 4,
      prompt: "What does depth give me that volume didn't?",
    },
  },
  {
    day: 72,
    theme: "Rehearse, Don't Cram",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "The Retest Is Next Week",
      theory:
        "The plan says practice retest tasks once, without overtraining them. Cramming before a measurement corrupts both the measurement and the calm — rehearsal is one clean pass, then trust.",
      task: "Schedule this week's single rehearsal pass of any retest task. One pass, on the calendar, and no bonus passes when nerves suggest them.",
      minutes: 2,
      prompt: "Can one rehearsal be enough?",
    },
    midday: {
      title: "One Clean Pass",
      theory:
        "The rehearsal's purpose is familiarity, not improvement: remind hands and feet of the format, note the setup, done. Improvement was the last ten weeks' job.",
      task: "If today holds your rehearsal: one clean unhurried pass, note the setup details, close the folder. If not, do today's keep-pile with the same one-pass mentality.",
      minutes: 5,
      prompt: "Did I stop after the clean pass?",
    },
    evening: {
      title: "Anti-Cram Review",
      theory:
        "The urge to squeeze in more before a measurement is fear dressed as diligence. Logging the urge — and its refusal — is week-eleven Stoicism in one line.",
      task: "Note tonight whether the cram urge visited, and record its refusal (or what happened instead). No drama either way.",
      minutes: 3,
      prompt: "Did fear dress up as diligence today?",
    },
  },
  {
    day: 73,
    theme: "Stability as Achievement",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Boring Is the Prize",
      theory:
        "Week eleven aims to make gains boring — repeatable, unremarkable, owned. In rehab, boring is the prize: it means the skill no longer needs occasion or luck.",
      task: "Name one gain that has become boring — reliable enough that you no longer notice it. Give it this morning's respect.",
      minutes: 2,
      prompt: "Which gain has earned the word 'reliable'?",
    },
    midday: {
      title: "Prove It Casually",
      theory:
        "A stable gain proves itself under casual conditions — tired, distracted, unceremonious. One casual demonstration today confirms ownership better than a formal test.",
      task: "Demonstrate your boring gain casually today: mid-conversation, post-walk, without setup. Note that it worked anyway.",
      minutes: 3,
      prompt: "Did the gain hold under casual conditions?",
    },
    evening: {
      title: "Ownership Review",
      theory:
        "The ledger of owned skills — things that work without ceremony — is the program's most durable output. Tonight it gets its entries updated.",
      task: "Update the owned-skills list: what now works without setup, warm-up, or luck. Read the full list once, slowly.",
      minutes: 5,
      prompt: "What do I own now?",
    },
  },
  {
    day: 74,
    theme: "The Practice That Stays",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Design the After",
      theory:
        "Programs end; practices continue. The Stoic morning routine that survives week twelve will be the one designed now, sized for real life: minutes, not hours.",
      task: "Draft your after-program morning practice: the two or three minutes of intention-setting you would actually keep doing in normal life. Try the draft today.",
      minutes: 3,
      prompt: "What morning practice survives the program?",
    },
    midday: {
      title: "Life-Sized Challenge",
      theory:
        "The midday challenge also needs its after-program size: one deliberate approach or calm rep folded into an ordinary day, no program required.",
      task: "Do today's midday practice in its after-program form: one small approach or one calm rep, embedded in normal activities, no ceremony.",
      minutes: 3,
      prompt: "What does the life-sized challenge look like?",
    },
    evening: {
      title: "Sustainable Review",
      theory:
        "An evening review that survives is short enough to do tired: three lines, most nights. Longer formats die in week thirteen; the three-line version can live for years.",
      task: "Do tonight's review in exactly three lines: responded well, fought reality, better tomorrow. Time it — under three minutes qualifies.",
      minutes: 3,
      prompt: "Can my review fit in three lines for life?",
    },
  },
  {
    day: 75,
    theme: "Teach It Once",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Explain the Method",
      theory:
        "Explaining a practice to someone else is the fastest audit of whether you understand it. Teaching also pays forward what the practice gave you — justice in circulation.",
      task: "Choose one Stoic tool from these eleven weeks and one person to explain it to today — seriously or casually. Prepare the two-sentence version.",
      minutes: 3,
      prompt: "Which tool can I explain in two sentences?",
    },
    midday: {
      title: "Give It Away",
      theory:
        "The explanation, delivered, does double duty: the listener gets a tool, and your understanding gets tested against real questions. Both parties leave richer.",
      task: "Deliver your two-sentence explanation today, in whatever context arises naturally. Answer one question about it if asked.",
      minutes: 4,
      prompt: "What did teaching reveal about my understanding?",
    },
    evening: {
      title: "Teacher's Review",
      theory:
        "What you reached for when explaining — the example, the emphasis — reveals what the practice actually means to you. Tonight's entry records that revelation.",
      task: "Write what your explanation emphasized and what that says about which part of the practice became truly yours.",
      minutes: 4,
      prompt: "What did I emphasize, and why that?",
    },
  },
  {
    day: 76,
    theme: "Gratitude Forward",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "Thank the Beginner",
      theory:
        "The person who started this program on day one took the hardest step with the least evidence. Gratitude flows backward to them — and forward, as obligation, to continue what they started.",
      task: "Write two sentences to day-one you: one of thanks for starting, one of report on what their start became.",
      minutes: 3,
      prompt: "What do I owe the person who started this?",
    },
    midday: {
      title: "The Gratitude Rep",
      theory:
        "One rep today is dedicated: done not for progress but as plain thanks — to the body, the plan, the people, the streak of days that got here. Dedication changes the texture of effort.",
      task: "Dedicate one rep, one flight, or one recording today as the gratitude rep. Do it beautifully, for nothing.",
      minutes: 3,
      prompt: "What was the gratitude rep like?",
    },
    evening: {
      title: "Debts of the Program",
      theory:
        "An honest accounting includes debts: the people who accommodated, encouraged, waited, helped. Naming them tonight prepares the thanks that should be spoken aloud soon.",
      task: "List the people this program owes. Choose one to actually thank, in words, before week twelve ends.",
      minutes: 4,
      prompt: "Who does this program owe?",
    },
  },
  {
    day: 77,
    theme: "Week Eleven Review",
    virtue: "temperance",
    processTag: "patience",
    morning: {
      title: "Calm Before Measurement",
      theory:
        "Tomorrow begins the final retest week. The consolidation review confirms readiness the Stoic way: preparation done, outcomes not owed, response trained either way.",
      task: "Confirm the three facts in writing: rehearsal complete, records honest, protocol known. Those are the only readiness that exists.",
      minutes: 3,
      prompt: "What does readiness actually consist of?",
    },
    midday: {
      title: "The Last Ordinary Session",
      theory:
        "Today holds the program's last ordinary training session. Ordinary is how it should feel — that ordinariness is eleven weeks of extraordinary work, compounded.",
      task: "Do today's keep-pile session and notice, once, how normal this all is now. That noticing is the session's real content.",
      minutes: 5,
      prompt: "How normal has the extraordinary become?",
    },
    evening: {
      title: "Eve of the Final Week",
      theory:
        "Whatever week twelve measures, the response to it is already trained: three columns, fair comparison, coach's decision. The measuring can now be welcomed as information.",
      task: "Write one sentence of welcome to week twelve — the same tone you would use for a guest bringing useful news of unknown content.",
      minutes: 4,
      prompt: "Can I welcome the measurement?",
    },
  },
];

// ---------------------------------------------------------------------------
// Week 12 — Final review and the path forward (final retest; next cycle)
// ---------------------------------------------------------------------------

const WEEK_12: StoicDayDef[] = [
  {
    day: 78,
    theme: "The Final Sitting",
    virtue: "temperance",
    processTag: "consistency",
    morning: {
      title: "Third Time Steady",
      theory:
        "This is the third pass through the retest ritual — the protocol is an old acquaintance now. Steadiness at a measurement you once dreaded is itself a headline result.",
      task: "Begin the final retest sequence with the established ritual. Before starting, register the difference between week-zero nerves and today's steadiness.",
      minutes: 3,
      prompt: "How does the third sitting compare to the first?",
    },
    midday: {
      title: "Ordinary Excellence, Filmed",
      theory:
        "The cameras record function, but they also record conduct: the pace, the composure, the recovery from flubs. Conduct is fully yours today; let the film show it.",
      task: "Complete today's scheduled retest items at practice pace, one honest take each. Let conduct be the controlled variable.",
      minutes: 6,
      prompt: "What did my conduct look like on camera?",
    },
    evening: {
      title: "File and Rest",
      theory:
        "Retest days end with clerical calm: data filed unread, body rested, interpretation left for the appointed review. The discipline of waiting is the last skill being tested.",
      task: "File today's results untouched. Write the single line — \"collected, filed, resting\" — and close the day early if you can.",
      minutes: 3,
      prompt: "Can I let the data wait?",
    },
  },
  {
    day: 79,
    theme: "Four Points Make a Line",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "The Long Comparison",
      theory:
        "Week zero, four, eight, twelve: four points, one line each direction. This is the comparison the whole system was built to produce — read it like the navigator, course-first.",
      task: "When comparisons happen this week, read trends before points: which direction did each function move across the four marks? Note the directions only, this morning.",
      minutes: 4,
      prompt: "What directions do the four points show?",
    },
    midday: {
      title: "Sit With Mixed Results",
      theory:
        "Real results are mixed — some lines up, some flat, some disappointing. Sitting with the full mixture, without flinching to either pole, is the reader the data deserves.",
      task: "Take ten unhurried minutes with the mixed picture today. Name one satisfaction and one disappointment out loud. Both are allowed to exist.",
      minutes: 10,
      prompt: "Can satisfaction and disappointment share the table?",
    },
    evening: {
      title: "Line Review",
      theory:
        "Tonight, one sentence per major goal — hand, leg, speech, whole-body, pacing — describing its twelve-week line in the navigator's neutral voice.",
      task: "Write the five sentences, one per goal area. Neutral voice, trend language, no verdicts on yourself as a person.",
      minutes: 5,
      prompt: "What are my five trend sentences?",
    },
  },
  {
    day: 80,
    theme: "The Character Audit",
    virtue: "justice",
    processTag: "consistency",
    morning: {
      title: "The Other Twelve Weeks",
      theory:
        "Alongside the function data runs the character data: eighty days of intentions, challenges, and reviews. That practice changed how you meet difficulty — the audit makes it visible.",
      task: "Answer this morning, one line each: complain less? check less? approach more? live more normally? respond better on bad days? Honest lines, from the whole twelve weeks.",
      minutes: 4,
      prompt: "What does the character audit show?",
    },
    midday: {
      title: "Evidence of the Change",
      theory:
        "Each audit line deserves one concrete memory as evidence — the stairs taken calmly, the take left unredone, the heavy day handled. Evidence turns impressions into record.",
      task: "Attach one specific remembered moment to your strongest audit line. Write it in two sentences where the summary can use it.",
      minutes: 4,
      prompt: "What moment proves the change?",
    },
    evening: {
      title: "Character Into the Summary",
      theory:
        "The clinician summary reports function; your own summary reports both scoreboards. The character results go in tonight, with the same standing as any timing.",
      task: "Add the character audit, with its evidence moment, to your twelve-week summary. It is a result, not a footnote.",
      minutes: 4,
      prompt: "Is the second scoreboard in the record?",
    },
  },
  {
    day: 81,
    theme: "The One-Page Summary",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "Compress With Care",
      theory:
        "The plan ends in one page: adherence, improvements, limits, triggers, questions. Compression is a wisdom exercise — keeping what informs, releasing what merely expresses.",
      task: "Draft the one-page summary this morning from the assembled pieces. Where two sentences say one thing, keep the clearer one.",
      minutes: 6,
      prompt: "What survives compression to one page?",
    },
    midday: {
      title: "The Stranger Test",
      theory:
        "The summary passes when a stranger-clinician could read it in two minutes and know what to ask next. Today's test reading — as that stranger — finds the gaps.",
      task: "Read your draft as the stranger. Mark anything confusing, missing, or mood-flavored. Fix the top two findings.",
      minutes: 5,
      prompt: "Does the page work for a stranger?",
    },
    evening: {
      title: "Summary Done",
      theory:
        "A finished, honest, useful document produced from twelve weeks of daily records — this is the deliverable, and it is done. Completion deserves one quiet acknowledgment.",
      task: "Declare the summary finished tonight. One line of acknowledgment: what it took to be able to write this page.",
      minutes: 3,
      prompt: "What did this one page actually take?",
    },
  },
  {
    day: 82,
    theme: "The Next-Cycle Decision",
    virtue: "wisdom",
    processTag: "attention",
    morning: {
      title: "Four Doors",
      theory:
        "The plan offers four doors: continue and progress, repeat with modifications, shift focus, or escalate a specific question. The decision belongs to the coach-self, made on the evidence now in hand.",
      task: "Read the four options against your summary this morning. Note which door the evidence leans toward and what would change your mind.",
      minutes: 4,
      prompt: "Which door does the evidence favor?",
    },
    midday: {
      title: "Walk the Favored Door",
      theory:
        "Before deciding, walk the favored option mentally: what would week one of that choice look like — its first session, its focus, its rhythm? Decisions improve when previewed.",
      task: "Sketch the first week behind your favored door in five lines. Feel whether it fits the life you are actually living now.",
      minutes: 5,
      prompt: "What does week one of the next cycle look like?",
    },
    evening: {
      title: "Decide and Rest",
      theory:
        "A decision made on evidence, previewed, and written down is complete — re-deciding it nightly is not diligence, it is leakage. Tonight it gets made and set down.",
      task: "Write the next-cycle decision and its two supporting facts. Then close the notebook; the decision is made.",
      minutes: 4,
      prompt: "Is the decision made and set down?",
    },
  },
  {
    day: 83,
    theme: "What the Program Cannot Give",
    virtue: "courage",
    processTag: "courage",
    morning: {
      title: "The Open Questions Stay Open",
      theory:
        "Twelve weeks answered many questions and left some open — diagnosis, timeline, the future. Stoicism's honest gift is capacity to live well beside open questions, not the closing of them.",
      task: "Name your biggest still-open question this morning. Then name what you can do well today regardless of its answer — and go do the day.",
      minutes: 3,
      prompt: "What stays open, and what is still mine to do?",
    },
    midday: {
      title: "Full Life, Open Question",
      theory:
        "The proof of the practice is a full afternoon lived beside the open question: training, people, meals, plans — the question present but not presiding.",
      task: "Live this afternoon deliberately fully — one training element, one human connection, one enjoyed thing — with the open question demoted to passenger.",
      minutes: 6,
      prompt: "Who presided today — the question or me?",
    },
    evening: {
      title: "Peace With the Unfinished",
      theory:
        "Marcus never finished becoming Stoic either; the Meditations end mid-practice. An unfinished practice is not a failed one — it is a living one.",
      task: "Write one paragraph making peace with what twelve weeks did not finish. End it with what continues anyway.",
      minutes: 5,
      prompt: "What continues regardless of what is unfinished?",
    },
  },
  {
    day: 84,
    theme: "The Path Forward",
    virtue: "wisdom",
    processTag: "consistency",
    morning: {
      title: "The Last Intention",
      theory:
        "The program's final morning intention doubles as its first post-program one: the same three minutes, the same separation of controllable from not, carried into open-ended life.",
      task: "Set this morning's intention in the sustainable format you designed: one thing not yours to control, one useful action that is. Note that this is now simply how mornings work.",
      minutes: 3,
      prompt: "What is my first post-program intention?",
    },
    midday: {
      title: "The Eighty-Fourth Rep",
      theory:
        "One final deliberate rep closes the arc: the same calm attention as day one, now resting on twelve weeks of evidence that you show up. Let it be unremarkable and complete.",
      task: "Do one last fully attended rep of any keep-pile movement. Start smooth, breathe steady, finish clean. That is the program, in one rep.",
      minutes: 4,
      prompt: "What did the last rep hold?",
    },
    evening: {
      title: "The Final Review",
      theory:
        "The last evening review looks at all of it — the function line, the character line, the decision, the open questions — and writes the closing entry a future cycle will someday reread.",
      task: "Write the closing entry: what was built, how you changed, what continues tomorrow morning. Sign it with the date. The path continues from here.",
      minutes: 6,
      prompt: "What do I want cycle-two me to read here?",
    },
  },
];

export const STOIC_REHAB_EXERCISES: StoicRehabExercise[] = [
  ...WEEK_1.flatMap(stoicDay),
  ...WEEK_2.flatMap(stoicDay),
  ...WEEK_3.flatMap(stoicDay),
  ...WEEK_4.flatMap(stoicDay),
  ...WEEK_5.flatMap(stoicDay),
  ...WEEK_6.flatMap(stoicDay),
  ...WEEK_7.flatMap(stoicDay),
  ...WEEK_8.flatMap(stoicDay),
  ...WEEK_9.flatMap(stoicDay),
  ...WEEK_10.flatMap(stoicDay),
  ...WEEK_11.flatMap(stoicDay),
  ...WEEK_12.flatMap(stoicDay),
];
