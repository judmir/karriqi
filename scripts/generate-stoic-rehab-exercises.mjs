import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { WEEK_THEMES, buildCurriculumRows } from "./stoic-rehab-curriculum.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(
  __dirname,
  "../modules/rehab/neuro-rehab-2026/stoic-rehab-exercises.ts",
);

const SLOT_CHECKLIST_TITLES = {
  morning: "Morning Stoic Intention",
  midday: "Midday Stoic Practice",
  evening: "Evening Stoic Reflection",
};

const rows = buildCurriculumRows();

const lines = [];
lines.push(
  `import type { StoicClassicalVirtue, StoicRehabExercise, StoicRehabSlot, StoicRehabSuggestedWhen } from "@/types/stoic-rehab";`,
);
lines.push("");
lines.push(
  "export const STOIC_REHAB_WEEK_THEMES: Record<number, string> = " +
    JSON.stringify(WEEK_THEMES, null, 2) +
    ";",
);
lines.push("");
lines.push("export const STOIC_REHAB_PROGRAM_DAYS = 84;");
lines.push("");
lines.push("export const STOIC_REHAB_SLOT_CHECKLIST_TITLES: Record<StoicRehabSlot, string> = " +
  JSON.stringify(SLOT_CHECKLIST_TITLES, null, 2) +
  ";");
lines.push("");
lines.push("function buildExercise(");
lines.push("  day: number,");
lines.push("  slot: StoicRehabSlot,");
lines.push("  contentTitle: string,");
lines.push("  dayTheme: string,");
lines.push("  virtue: StoicClassicalVirtue,");
lines.push("  theory: string,");
lines.push("  task: string,");
lines.push("  journalPrompt: string,");
lines.push("  durationMinutes: number,");
lines.push("  tags: string[],");
lines.push('  intensity: StoicRehabExercise["intensity"],');
lines.push("  suggestedWhen: StoicRehabSuggestedWhen,");
lines.push("): StoicRehabExercise {");
lines.push("  const week = Math.ceil(day / 7);");
lines.push("  const checklistTitle = STOIC_REHAB_SLOT_CHECKLIST_TITLES[slot];");
lines.push("  return {");
lines.push(
  '    id: `stoic-day-${String(day).padStart(2, "0")}-${slot}`,',
);
lines.push("    day,");
lines.push("    week,");
lines.push("    slot,");
lines.push('    title: `${checklistTitle} · ${contentTitle}`,');
lines.push("    contentTitle,");
lines.push("    dayTheme,");
lines.push("    theme: STOIC_REHAB_WEEK_THEMES[week],");
lines.push("    virtue,");
lines.push('    category: "stoicism",');
lines.push("    theory,");
lines.push("    task,");
lines.push("    journalPrompt,");
lines.push("    durationMinutes,");
lines.push("    tags,");
lines.push("    intensity,");
lines.push("    suggestedWhen,");
lines.push("  };");
lines.push("}");
lines.push("");
lines.push("function buildDailyTriad(");
lines.push("  day: number,");
lines.push("  def: {");
lines.push("    dayTheme: string;");
lines.push("    virtue: StoicClassicalVirtue;");
lines.push("    morning: { contentTitle: string; theory: string; task: string; durationMinutes: number; journalPrompt?: string };");
lines.push("    midday: { contentTitle: string; theory: string; task: string; durationMinutes: number; journalPrompt?: string };");
lines.push("    evening: { contentTitle: string; theory: string; task: string; durationMinutes: number; journalPrompt?: string };");
lines.push("    tags: string[];");
lines.push('    intensity: StoicRehabExercise["intensity"];');
lines.push("  },");
lines.push("): StoicRehabExercise[] {");
lines.push("  const { dayTheme, virtue, morning, midday, evening, tags, intensity } = def;");
lines.push("  return [");
lines.push(
  "    buildExercise(day, \"morning\", morning.contentTitle, dayTheme, virtue, morning.theory, morning.task, morning.journalPrompt ?? \"Which one line will guide today?\", morning.durationMinutes, tags, \"light\", \"morning\"),",
);
lines.push(
  "    buildExercise(day, \"midday\", midday.contentTitle, dayTheme, virtue, midday.theory, midday.task, midday.journalPrompt ?? \"What happened when you tried this?\", midday.durationMinutes, tags, intensity, \"during_life\"),",
);
lines.push(
  "    buildExercise(day, \"evening\", evening.contentTitle, dayTheme, virtue, evening.theory, evening.task, evening.journalPrompt ?? \"Did I complete a useful action today?\", evening.durationMinutes, tags, \"light\", \"evening\"),",
);
lines.push("  ];");
lines.push("}");
lines.push("");
lines.push("export const STOIC_REHAB_EXERCISES: StoicRehabExercise[] = [");
for (const def of rows) {
  const { day, ...rest } = def;
  lines.push(`  ...buildDailyTriad(${day}, ${JSON.stringify(rest)}),`);
}
lines.push("];");
lines.push("");
lines.push("export const STOIC_REHAB_EXERCISES_PER_DAY = 3;");
lines.push("");

writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(
  `Wrote ${rows.length * 3} exercises (${rows.length} days × 3 slots) to ${outPath}`,
);
