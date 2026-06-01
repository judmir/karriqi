export type EventSubtask = {
  id: string;
  label: string;
  done: boolean;
};

const SUBTASKS_MARKER = /<!-- karriqi-subtasks:([\s\S]+?) -->$/;

export function parseEventDescription(raw: string | null | undefined): {
  description: string;
  subtasks: EventSubtask[];
} {
  if (!raw) {
    return { description: "", subtasks: [] };
  }

  const match = raw.match(SUBTASKS_MARKER);
  if (!match || match.index === undefined) {
    return { description: raw, subtasks: [] };
  }

  const description = raw.slice(0, match.index).trimEnd();
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(parsed)) {
      return { description, subtasks: [] };
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
      }));
    return { description, subtasks };
  } catch {
    return { description, subtasks: [] };
  }
}

export function serializeEventDescription(
  description: string,
  subtasks: EventSubtask[],
): string | null {
  const trimmedDescription = description.trim();
  const cleanSubtasks = subtasks
    .map((item) => ({
      id: item.id,
      label: item.label.trim(),
      done: item.done,
    }))
    .filter((item) => item.label.length > 0);

  if (cleanSubtasks.length === 0) {
    return trimmedDescription || null;
  }

  const payload = JSON.stringify(cleanSubtasks);
  if (!trimmedDescription) {
    return `<!-- karriqi-subtasks:${payload} -->`;
  }

  return `${trimmedDescription}\n\n<!-- karriqi-subtasks:${payload} -->`;
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
      item.done === other.done
    );
  });
}
