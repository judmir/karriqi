"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useInstantNavigation } from "@/components/providers/instant-navigation-provider";

export function useInstantNavigate() {
  const router = useRouter();
  const { startNavigation } = useInstantNavigation();

  return useCallback(
    (href: string) => {
      startNavigation(href);
      router.prefetch(href);
      router.push(href);
    },
    [router, startNavigation],
  );
}
