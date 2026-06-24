"use client";

import { useRef, type ReactNode } from "react";

import type { DashboardPageData } from "@/stores/load-actions";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";

/**
 * Seeds Zustand stores from the dashboard RSC prefetch so the first client
 * paint can render real content instead of waiting for post-hydrate server
 * actions (especially noticeable on iPhone PWA cold opens).
 */
export function DashboardStoreHydrator({
  data,
  children,
}: {
  data: DashboardPageData;
  children: ReactNode;
}) {
  const hydrated = useRef(false);

  if (!hydrated.current) {
    if (data.rehab.ok) {
      useRehabPlanStore
        .getState()
        .hydrate(data.rehab.events, data.rehab.persistence);
    }
    if (data.ruleOf3.ok) {
      useRuleOf3Store
        .getState()
        .hydrate(data.ruleOf3.days, data.ruleOf3.persistence);
    }
    hydrated.current = true;
  }

  return children;
}
