"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  rehabEventPath,
  type RehabEventReturnTo,
} from "@/config/routes";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { isStoicEvent } from "@/lib/rehab/stoic-response";
import type { RehabPlanEvent } from "@/types/rehab";

type OpenRehabEventEditOptions = {
  openTaskModal: (event: RehabPlanEvent) => void;
  openJournalModal: (event: RehabPlanEvent) => void;
  openStoicModal: (event: RehabPlanEvent) => void;
};

export function useOpenRehabEventEdit(returnTo: RehabEventReturnTo) {
  const router = useRouter();
  const isMobile = useIsMobile();

  return useCallback(
    (event: RehabPlanEvent, handlers: OpenRehabEventEditOptions) => {
      if (event.eventKind === "journal") {
        handlers.openJournalModal(event);
        return;
      }

      if (isStoicEvent(event)) {
        handlers.openStoicModal(event);
        return;
      }

      if (isMobile) {
        router.push(rehabEventPath(event.id, returnTo));
        return;
      }

      handlers.openTaskModal(event);
    },
    [isMobile, returnTo, router],
  );
}
