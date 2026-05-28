export type ChecklistLine = {
  index: number;
  text: string;
  checked: boolean;
  raw: string;
};

const CHECKLIST_RE = /^(\s*)- \[([ xX])\]\s*(.*)$/;

export function parseChecklistLines(content: string): ChecklistLine[] {
  const lines: ChecklistLine[] = [];
  content.split("\n").forEach((line, index) => {
    const match = line.match(CHECKLIST_RE);
    if (!match) return;
    lines.push({
      index,
      text: match[3] ?? "",
      checked: (match[2] ?? "").toLowerCase() === "x",
      raw: line,
    });
  });
  return lines;
}

export function isChecklistNote(content: string): boolean {
  return parseChecklistLines(content).length > 0;
}

export function toggleChecklistLine(
  content: string,
  lineIndex: number,
): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (!line) return content;
  const match = line.match(CHECKLIST_RE);
  if (!match) return content;
  const checked = (match[2] ?? "").toLowerCase() === "x";
  const nextMark = checked ? " " : "x";
  lines[lineIndex] = `${match[1]}- [${nextMark}] ${match[3] ?? ""}`;
  return lines.join("\n");
}
