import type { RehabEventKind } from "@/types/rehab";

/** Gym C (dynamic stability) — Friday evening, all weeks. */
export const GYM_C_WEEKDAY = 5;
export const GYM_C_START_HOUR = 18;
export const GYM_C_START_MINUTE = 0;

/** Calendar title for all `run_walk` program events (speech/football stay separate). */
export const RUN_EVENT_TITLE = "Run";

export type WeekdayTemplate = {
  mainKind: RehabEventKind;
  mainTitle: string;
  mainDescription: string;
  handMinutes: number;
  includeFootball: boolean;
  includeGymD: boolean;
  mainStartHour: number;
  mainStartMinute: number;
  /** Saturday: optional easy walk after gym (4th cardio day). */
  includeEasyWalk?: boolean;
  /** Sunday: light walk only — no gym. */
  isSundayEasyWalk?: boolean;
};

export function weekdayTemplate(
  dayOfWeek: number,
  _week: number,
  isRetest: boolean,
): WeekdayTemplate {
  // 0=Sun, 1=Mon, ... 6=Sat
  // Gym: Wed (A), Fri 18:00 (C), Sat (B). Run/walk: Sun easy, Mon, Tue, Thu, Sat easy.
  switch (dayOfWeek) {
    case 1:
      return {
        mainKind: "run_walk",
        mainTitle: RUN_EVENT_TITLE,
        mainDescription: "Easy run/walk session.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
      };
    case 2:
      return {
        mainKind: "run_walk",
        mainTitle: RUN_EVENT_TITLE,
        mainDescription: "Easy run/walk session.",
        handMinutes: 20,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
      };
    case 3:
      return {
        mainKind: "gym_a",
        mainTitle: isRetest ? "Gym A (deload)" : "Gym A — lower body + left leg",
        mainDescription: "See Wiki: Gym Workouts — Gym A.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
      };
    case 4:
      return {
        mainKind: "run_walk",
        mainTitle: RUN_EVENT_TITLE,
        mainDescription: "Easy walk/run then ball-control drills.",
        handMinutes: 10,
        includeFootball: true,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
      };
    case 5:
      return {
        mainKind: "gym_c",
        mainTitle: isRetest ? "Gym C (deload)" : "Gym C — dynamic stability",
        mainDescription: "See Wiki: Gym Workouts — Gym C.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: GYM_C_START_HOUR,
        mainStartMinute: GYM_C_START_MINUTE,
      };
    case 6:
      return {
        mainKind: "gym_b",
        mainTitle: isRetest ? "Gym B (deload)" : "Gym B — upper body + core",
        mainDescription: "See Wiki: Gym Workouts — Gym B.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
        includeEasyWalk: true,
      };
    case 0:
      return {
        mainKind: "run_walk",
        mainTitle: RUN_EVENT_TITLE,
        mainDescription:
          "Sunday easy walk only — light mobility. Complete weekly review in journal/wiki.",
        handMinutes: 0,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
        isSundayEasyWalk: true,
      };
    default:
      return {
        mainKind: "recovery",
        mainTitle: "Recovery + weekly review",
        mainDescription: "Light mobility. Complete weekly review in journal/wiki.",
        handMinutes: 0,
        includeFootball: false,
        includeGymD: false,
        mainStartHour: 9,
        mainStartMinute: 0,
      };
  }
}
