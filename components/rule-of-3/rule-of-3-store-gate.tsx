"use client";

import { useEffect, type ReactNode } from "react";

import { selectRuleOf3Ready, useRuleOf3Store } from "@/stores/rule-of-3-store";

export function RuleOf3StoreGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ensureLoaded = useRuleOf3Store((state) => state.ensureLoaded);
  const ready = useRuleOf3Store(selectRuleOf3Ready);
  const error = useRuleOf3Store((state) => state.error);

  useEffect(() => {
    if (ready) {
      return;
    }
    void ensureLoaded();
  }, [ensureLoaded, ready]);

  if (error) {
    return (
      <div className="text-muted-foreground flex items-center justify-center px-4 py-8 text-sm">
        {error}
      </div>
    );
  }

  if (!ready) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
