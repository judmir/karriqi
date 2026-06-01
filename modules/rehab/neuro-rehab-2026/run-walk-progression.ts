export type RunWalkPlan = {
  title: string;
  description: string;
};

export function runWalkPlanForWeek(week: number): RunWalkPlan {
  if (week <= 2) {
    return {
      title: "Easy walk",
      description: "Weeks 1–2: Easy walks only, 20–45 min. No jogging yet.",
    };
  }
  if (week <= 4) {
    return {
      title: "Run/walk intervals",
      description:
        "Weeks 3–4: 1 min jog / 2 min walk × 6 if stable. Stop if symptoms flare.",
    };
  }
  if (week <= 6) {
    return {
      title: "Run/walk intervals",
      description: "Weeks 5–6: 1–2 min jog / 2 min walk × 6–8.",
    };
  }
  if (week <= 8) {
    return {
      title: "Run/walk build",
      description:
        "Weeks 7–8: Slightly longer easy intervals. No speed chasing.",
    };
  }
  if (week <= 10) {
    return {
      title: "Easy run build",
      description:
        "Weeks 9–10: Build toward continuous easy running if tolerated.",
    };
  }
  if (week === 11) {
    return {
      title: "Easy run consolidate",
      description: "Week 11: Consolidate. Do not add novelty.",
    };
  }
  return {
    title: "Easy walk/run (retest prep)",
    description: "Week 12: Easy only before final retest.",
  };
}
