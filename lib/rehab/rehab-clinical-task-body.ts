export type ParsedClinicalTaskBody = {
  description: string;
  subtasks: string[];
};

const BULLET_LINE = /^-\s+(.+)$/;

export function parseClinicalTaskBody(body: string): ParsedClinicalTaskBody {
  const trimmed = body.trim();
  if (!trimmed) {
    return { description: "", subtasks: [] };
  }

  const blocks = trimmed.split(/\n\n+/);
  const descriptionParts: string[] = [];
  const subtasks: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const bulletLines = lines.filter((line) => BULLET_LINE.test(line));
    const nonBulletLines = lines.filter(
      (line) => line.trim().length > 0 && !BULLET_LINE.test(line),
    );

    if (bulletLines.length > 0) {
      for (const line of bulletLines) {
        const match = BULLET_LINE.exec(line);
        if (match?.[1]) {
          subtasks.push(match[1].trim());
        }
      }
    }

    if (nonBulletLines.length > 0) {
      descriptionParts.push(nonBulletLines.join("\n").trim());
    }
  }

  return {
    description: descriptionParts.join("\n\n").trim(),
    subtasks,
  };
}

export function countSubtasksDone(
  subtasksDone: number[],
  subtaskCount: number,
): number {
  const valid = new Set(
    subtasksDone.filter(
      (index) => Number.isInteger(index) && index >= 0 && index < subtaskCount,
    ),
  );
  return valid.size;
}

export function allSubtasksDone(
  subtasksDone: number[],
  subtaskCount: number,
): boolean {
  return subtaskCount > 0 && countSubtasksDone(subtasksDone, subtaskCount) === subtaskCount;
}

export function isClinicalSubtaskDone(
  subtasksDone: number[],
  index: number,
): boolean {
  return subtasksDone.includes(index);
}

export function toggleClinicalSubtaskDone(
  subtasksDone: number[],
  index: number,
  completed: boolean,
  subtaskCount: number,
): number[] {
  const next = new Set(
    subtasksDone.filter(
      (value) => Number.isInteger(value) && value >= 0 && value < subtaskCount,
    ),
  );
  if (completed) {
    next.add(index);
  } else {
    next.delete(index);
  }
  return [...next].sort((a, b) => a - b);
}

export function allClinicalSubtaskIndices(subtaskCount: number): number[] {
  return Array.from({ length: subtaskCount }, (_, index) => index);
}
