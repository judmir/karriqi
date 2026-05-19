"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAttachmentPreviewKind,
  type AttachmentPreviewKind,
} from "@/lib/todo/attachment-preview";
import { cn } from "@/lib/utils";

type AttachmentHoverPreviewProps = {
  signedUrl: string | null;
  fileName: string;
  mimeType: string | null;
  children: ReactNode;
  className?: string;
};

function PreviewBody({
  kind,
  signedUrl,
  fileName,
}: {
  kind: AttachmentPreviewKind;
  signedUrl: string;
  fileName: string;
}) {
  if (kind === "image") {
    return (
      <img
        src={signedUrl}
        alt={fileName}
        className="max-h-[min(60vh,360px)] max-w-[min(85vw,340px)] rounded-sm object-contain"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <iframe
      src={`${signedUrl}#toolbar=0&navpanes=0`}
      title={fileName}
      className="h-[min(60vh,360px)] w-[min(85vw,320px)] rounded-sm border-0 bg-muted"
    />
  );
}

export function AttachmentHoverPreview({
  signedUrl,
  fileName,
  mimeType,
  children,
  className,
}: AttachmentHoverPreviewProps) {
  const kind = getAttachmentPreviewKind(mimeType, fileName);
  if (!kind || !signedUrl) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "min-w-0 flex-1 cursor-default rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
        render={<div tabIndex={0} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={10}
        align="start"
        className="border-border bg-card text-card-foreground max-w-none px-2.5 py-2 shadow-xl"
      >
        <p className="text-muted-foreground mb-1.5 max-w-[min(85vw,340px)] truncate text-[11px] font-normal">
          {fileName}
        </p>
        <PreviewBody kind={kind} signedUrl={signedUrl} fileName={fileName} />
      </TooltipContent>
    </Tooltip>
  );
}
