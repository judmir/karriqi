"use client";

import { useCallback } from "react";

import {
  rehabEventPath,
  type RehabEventReturnTo,
} from "@/config/routes";
import { useInstantNavigate } from "@/hooks/use-instant-navigate";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { isStoicEvent, isStoicDialogEvent } from "@/lib/rehab/stoic-response";
import {
  isLegacyStoicIntentionEvent,
  isStoicPathPlanEvent,
} from "@/lib/rehab/stoic-rehab-utils";
import type { RehabPlanEvent } from "@/types/rehab";

type OpenRehabEventEditOptions = {
  openTaskModal: (event: RehabPlanEvent) => void;
  openJournalModal: (event: RehabPlanEvent) => void;
  openStoicModal: (event: RehabPlanEvent) => void;
  openStoicPathModal: (event: RehabPlanEvent) => void;
};

export function useOpenRehabEventEdit(returnTo: RehabEventReturnTo) {
  const navigate = useInstantNavigate();
  const isMobile = useIsMobile();

  return useCallback(
    (event: RehabPlanEvent, handlers: OpenRehabEventEditOptions) => {
      if (event.eventKind === "journal") {
        handlers.openJournalModal(event);
        return;
      }

      if (isStoicPathPlanEvent(event) || isLegacyStoicIntentionEvent(event)) {
        handlers.openStoicPathModal(event);
        return;
      }

      if (isStoicEvent(event) && isStoicDialogEvent(event)) {
        handlers.openStoicModal(event);
        return;
      }

      if (isMobile) {
        navigate(rehabEventPath(event.id, returnTo));
        return;
      }

      handlers.openTaskModal(event);
    },
    [isMobile, navigate, returnTo],
  );
}
