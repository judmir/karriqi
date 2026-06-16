import type { RehabEventKind } from "@/types/rehab";

export type WeekdayTemplate = {
  mainKind: RehabEventKind;
  mainTitle: string;
  mainDescription: string;
  handMinutes: number;
  includeSpeech: boolean;
  includeFootball: boolean;
  includeGymD: boolean;
  skipMainOnRetest?: boolean;
};

export function weekdayTemplate(
  dayOfWeek: number,
  week: number,
  isRetest: boolean,
): WeekdayTemplate {
  // 0=Sun, 1=Mon, ... 6=Sat — gym Wed/Sat/Sun, run Mon/Tue/Thu/Fri
  switch (dayOfWeek) {
    case 1:
    case 2:
    case 4:
    case 5:
      return {
        mainKind: "run_walk",
        mainTitle:
          dayOfWeek === 2 || dayOfWeek === 5
            ? "Run/walk + speech"
            : dayOfWeek === 4
              ? "Run/walk + football control"
              : "Run/walk",
        mainDescription:
          dayOfWeek === 4
            ? "Easy walk/run then ball-control drills."
            : "Run/walk session.",
        handMinutes: dayOfWeek === 2 ? 20 : 10,
        includeSpeech: dayOfWeek === 2 || dayOfWeek === 5,
        includeFootball: dayOfWeek === 4,
        includeGymD: false,
      };
    case 3:
      return {
        mainKind: "gym_a",
        mainTitle: isRetest ? "Gym A (deload)" : "Gym A — lower body + left leg",
        mainDescription: "See Wiki: Gym Workouts — Gym A.",
        handMinutes: 10,
        includeSpeech: false,
        includeFootball: false,
        includeGymD: false,
      };
    case 6:
      return {
        mainKind: isRetest ? "recovery" : "gym_b",
        mainTitle: isRetest
          ? "Light recovery / mobility"
          : "Gym B — upper body + core",
        mainDescription: isRetest
          ? "Optional light mobility only."
          : "See Wiki: Gym Workouts — Gym B.",
        handMinutes: 10,
        includeSpeech: false,
        includeFootball: false,
        includeGymD: false,
      };
    case 0:
      return {
        mainKind: isRetest ? "recovery" : "gym_c",
        mainTitle: isRetest
          ? "Recovery + weekly review"
          : "Gym C — dynamic stability",
        mainDescription: isRetest
          ? "Light mobility. Complete weekly review in journal/wiki."
          : "See Wiki: Gym Workouts — Gym C.",
        handMinutes: isRetest ? 0 : 10,
        includeSpeech: false,
        includeFootball: false,
        includeGymD: false,
        skipMainOnRetest: false,
      };
    default:
      return {
        mainKind: "recovery",
        mainTitle: "Recovery + weekly review",
        mainDescription: "Light mobility. Complete weekly review in journal/wiki.",
        handMinutes: 0,
        includeSpeech: false,
        includeFootball: false,
        includeGymD: false,
      };
  }
}
