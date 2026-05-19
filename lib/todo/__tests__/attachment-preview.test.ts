import { describe, expect, it } from "vitest";

import {
  getAttachmentPreviewKind,
  isImageAttachment,
  isPdfAttachment,
} from "@/lib/todo/attachment-preview";

describe("attachment preview helpers", () => {
  it("detects images by mime or extension", () => {
    expect(isImageAttachment("image/png", "doc.txt")).toBe(true);
    expect(isImageAttachment(null, "photo.JPEG")).toBe(true);
    expect(isImageAttachment("application/pdf", "scan.pdf")).toBe(false);
  });

  it("detects PDFs by mime or extension", () => {
    expect(isPdfAttachment("application/pdf", "notes.txt")).toBe(true);
    expect(isPdfAttachment(null, "invoice.PDF")).toBe(true);
    expect(isPdfAttachment("image/png", "x.png")).toBe(false);
  });

  it("returns preview kind for supported files only", () => {
    expect(getAttachmentPreviewKind("image/webp", "a.webp")).toBe("image");
    expect(getAttachmentPreviewKind(null, "report.pdf")).toBe("pdf");
    expect(getAttachmentPreviewKind(null, "archive.zip")).toBeNull();
  });
});
