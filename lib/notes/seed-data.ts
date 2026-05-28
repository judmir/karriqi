import type { Note, NoteLabel } from "@/types/notes";

export const DEFAULT_NOTE_LABELS: NoteLabel[] = [
  { id: "label-personal", name: "Personal", color: "blue" },
  { id: "label-family", name: "Family", color: "green" },
  { id: "label-tasks", name: "Tasks", color: "orange" },
  { id: "label-meetings", name: "Meetings", color: "purple" },
];

const now = "2026-05-01T10:00:00.000Z";

export const DEFAULT_NOTES: Note[] = [
  {
    id: "note-sunset",
    title: "Mountain Sunset Photography",
    content:
      "Captured this beautiful sunset during our hiking trip. The colors were absolutely stunning!",
    labelIds: ["label-family", "label-personal"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-grocery",
    title: "Weekly Grocery List",
    content: `- Organic vegetables
- Whole grain bread
- Greek yogurt
- Fresh fruits
- Chicken breast
- Quinoa
- Almond milk`,
    labelIds: ["label-personal", "label-meetings"],
    archived: false,
    pinned: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-milestones",
    title: "Project Milestones",
    content: `Q1 Goals:
- Launch beta version
- Gather user feedback
- Implement core features
- Performance optimization
- Security audit
- Documentation update`,
    labelIds: ["label-tasks"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-desert",
    title: "Desert Road Trip Ideas",
    content:
      "Potential routes for our upcoming desert adventure. Need to plan stops and accommodation.",
    labelIds: ["label-personal"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-renovation",
    title: "Home Renovation Tasks",
    content: `- Paint living room
- Replace kitchen faucet
- Fix bathroom tiles
- Install new light fixtures`,
    labelIds: ["label-tasks"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
];
