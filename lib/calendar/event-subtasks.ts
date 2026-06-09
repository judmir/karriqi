export type EventSubtask = {
  id: string;
  label: string;
  done: boolean;
  referenceLabel?: string;
  referenceUrl?: string;
};

const SUBTASKS_MARKER = /<!-- karriqi-subtasks:([\s\S]+?) -->$/;
const MY_NOTES_MARKER = /<!-- karriqi-mynotes:([\s\S]+?) -->/;

function stripMyNotesMarker(raw: string): { myNotes: string; rest: string } {
  const match = raw.match(MY_NOTES_MARKER);
  if (!match || match.index === undefined) {
    return { myNotes: "", rest: raw };
  }

  let myNotes = "";
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    myNotes = typeof parsed === "string" ? parsed : "";
  } catch {
    myNotes = match[1];
  }

  const rest = (
    raw.slice(0, match.index) + raw.slice(match.index + match[0].length)
  ).trim();

  return { myNotes, rest };
}

export function parseEventDescription(raw: string | null | undefined): {
  description: string;
  subtasks: EventSubtask[];
  myNotes: string;
} {
  if (!raw) {
    return { description: "", subtasks: [], myNotes: "" };
  }

  const { myNotes, rest } = stripMyNotesMarker(raw);
  const match = rest.match(SUBTASKS_MARKER);
  if (!match || match.index === undefined) {
    return { description: rest, subtasks: [], myNotes };
  }

  const description = rest.slice(0, match.index).trimEnd();
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(parsed)) {
      return { description, subtasks: [], myNotes };
    }
    const subtasks = parsed
      .filter(
        (item): item is EventSubtask =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as EventSubtask).id === "string" &&
          typeof (item as EventSubtask).label === "string" &&
          typeof (item as EventSubtask).done === "boolean",
      )
      .map((item) => ({
        id: item.id,
        label: item.label,
        done: item.done,
        ...(typeof item.referenceLabel === "string" &&
        item.referenceLabel.trim().length > 0
          ? { referenceLabel: item.referenceLabel.trim() }
          : {}),
        ...(typeof item.referenceUrl === "string" &&
        item.referenceUrl.trim().length > 0
          ? { referenceUrl: item.referenceUrl.trim() }
          : {}),
      }));
    return { description, subtasks, myNotes };
  } catch {
    return { description, subtasks: [], myNotes };
  }
}

export function serializeEventDescription(
  description: string,
  subtasks: EventSubtask[],
  myNotes = "",
): string | null {
  const trimmedDescription = description.trim();
  const trimmedMyNotes = myNotes.trim();
  const cleanSubtasks = subtasks
    .map((item) => ({
      id: item.id,
      label: item.label.trim(),
      done: item.done,
      referenceLabel: item.referenceLabel?.trim(),
      referenceUrl: item.referenceUrl?.trim(),
    }))
    .filter((item) => item.label.length > 0)
    .map((item) => ({
      id: item.id,
      label: item.label,
      done: item.done,
      ...(item.referenceLabel ? { referenceLabel: item.referenceLabel } : {}),
      ...(item.referenceUrl ? { referenceUrl: item.referenceUrl } : {}),
    }));

  const parts: string[] = [];
  if (trimmedDescription) {
    parts.push(trimmedDescription);
  }
  if (trimmedMyNotes) {
    parts.push(`<!-- karriqi-mynotes:${JSON.stringify(trimmedMyNotes)} -->`);
  }
  if (cleanSubtasks.length > 0) {
    parts.push(`<!-- karriqi-subtasks:${JSON.stringify(cleanSubtasks)} -->`);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

/** Strips any embedded karriqi metadata markers (subtasks, journal, …). */
const METADATA_MARKER = /<!-- karriqi-[a-z-]+:[\s\S]*? -->/g;

export function getEventDescriptionPlainText(
  raw: string | null | undefined,
): string | null {
  if (!raw) {
    return null;
  }
  const cleaned = raw.replace(METADATA_MARKER, "").trim();
  return cleaned || null;
}

export function subtasksEqual(a: EventSubtask[], b: EventSubtask[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      item.label === other.label &&
      item.done === other.done &&
      item.referenceLabel === other.referenceLabel &&
      item.referenceUrl === other.referenceUrl
    );
  });
}
