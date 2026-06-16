import type { RehabEventKind } from "@/types/rehab";

export type WeekdayTemplate = {
  mainKind: RehabEventKind;
  mainTitle: string;
  mainDescription: string;
  handMinutes: number;
  includeFootball: boolean;
  includeGymD: boolean;
  skipMainOnRetest?: boolean;
};

export function weekdayTemplate(
  dayOfWeek: number,
  week: number,
  isRetest: boolean,
): WeekdayTemplate {
  // 0=Sun, 1=Mon, ... 6=Sat
  // Gym: Wed, Sat, Sun (3×/week). Running: Mon, Tue, Thu, Fri.
  switch (dayOfWeek) {
    case 1:
      return {
        mainKind: "run_walk",
        mainTitle: "Run/walk",
        mainDescription: "Easy run/walk session.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
      };
    case 2:
      return {
        mainKind: "run_walk",
        mainTitle: "Run/walk",
        mainDescription: "Easy run/walk session.",
        handMinutes: 20,
        includeFootball: false,
        includeGymD: false,
      };
    case 3:
      return {
        mainKind: "gym_a",
        mainTitle: isRetest ? "Gym A (deload)" : "Gym A — lower body + left leg",
        mainDescription: "See Wiki: Gym Workouts — Gym A.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
      };
    case 4:
      return {
        mainKind: "run_walk",
        mainTitle: "Run/walk + football control",
        mainDescription: "Easy walk/run then ball-control drills.",
        handMinutes: 10,
        includeFootball: true,
        includeGymD: false,
      };
    case 5:
      return {
        mainKind: "run_walk",
        mainTitle: "Run/walk",
        mainDescription: "Easy run/walk session.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
      };
    case 6:
      return {
        mainKind: "gym_b",
        mainTitle: isRetest ? "Gym B (deload)" : "Gym B — upper body + core",
        mainDescription: "See Wiki: Gym Workouts — Gym B.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
      };
    case 0:
      return {
        mainKind: "gym_c",
        mainTitle: isRetest ? "Gym C (deload)" : "Gym C — dynamic stability",
        mainDescription: "See Wiki: Gym Workouts — Gym C.",
        handMinutes: 10,
        includeFootball: false,
        includeGymD: false,
      };
    default:
      return {
        mainKind: "recovery",
        mainTitle: "Recovery + weekly review",
        mainDescription: "Light mobility. Complete weekly review in journal/wiki.",
        handMinutes: 0,
        includeFootball: false,
        includeGymD: false,
      };
  }
}
