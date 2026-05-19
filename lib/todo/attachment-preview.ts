export type AttachmentPreviewKind = "image" | "pdf";

const IMAGE_MIME_PREFIX = "image/";

const IMAGE_EXT =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;

const PDF_EXT = /\.pdf$/i;

function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i) : "";
}

export function isImageAttachment(
  mimeType: string | null,
  fileName: string,
): boolean {
  if (mimeType?.startsWith(IMAGE_MIME_PREFIX)) return true;
  return IMAGE_EXT.test(extensionOf(fileName));
}

export function isPdfAttachment(
  mimeType: string | null,
  fileName: string,
): boolean {
  if (mimeType === "application/pdf") return true;
  return PDF_EXT.test(extensionOf(fileName));
}

/** Returns preview type when the file can be shown on hover; otherwise null. */
export function getAttachmentPreviewKind(
  mimeType: string | null,
  fileName: string,
): AttachmentPreviewKind | null {
  if (isImageAttachment(mimeType, fileName)) return "image";
  if (isPdfAttachment(mimeType, fileName)) return "pdf";
  return null;
}
