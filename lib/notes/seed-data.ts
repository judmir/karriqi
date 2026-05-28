import type { Note, NoteLabel } from "@/types/notes";

export const DEFAULT_NOTE_LABELS: NoteLabel[] = [
  { id: "label-family", name: "Family", color: "pink" },
  { id: "label-tasks", name: "Tasks", color: "purple" },
  { id: "label-personal", name: "Personal", color: "green" },
  { id: "label-meetings", name: "Meetings", color: "blue" },
  { id: "label-shopping", name: "Shopping", color: "teal" },
  { id: "label-planning", name: "Planning", color: "orange" },
  { id: "label-travel", name: "Travel", color: "blue" },
];

const now = "2026-05-01T10:00:00.000Z";

export const DEFAULT_NOTES: Note[] = [
  {
    id: "note-sunset",
    title: "Mountain Sunset Photography",
    content:
      "Captured this beautiful sunset during our hiking trip. The colors were absolutely stunning!",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=360&fit=crop",
    labelIds: ["label-family", "label-personal"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-grocery",
    title: "Weekly Grocery List",
    content: `- [x] Organic vegetables
- [x] Whole grain bread
- [ ] Greek yogurt
- [ ] Fresh fruits
- [ ] Chicken breast
- [x] Quinoa
- [ ] Almond milk`,
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
    imageUrl:
      "https://images.unsplash.com/photo-1617802690998-4a050b511a46?w=600&h=720&fit=crop",
    labelIds: ["label-personal"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "note-renovation",
    title: "Home Renovation Tasks",
    content: `- [ ] Paint living room
- [ ] Replace kitchen faucet
- [ ] Fix bathroom tiles
- [ ] Install new light fixtures`,
    labelIds: ["label-tasks"],
    archived: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
];
