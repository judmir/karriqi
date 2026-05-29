"use client";

import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const READ_ONLY_MESSAGE =
  "View-only calendar. Add or change events in Google Calendar, then tap Sync.";

export function CalendarReadOnlyInfo() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={READ_ONLY_MESSAGE}
          />
        }
      >
        <InfoIcon className="text-muted-foreground size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-[16rem]">
        {READ_ONLY_MESSAGE}
      </TooltipContent>
    </Tooltip>
  );
}
