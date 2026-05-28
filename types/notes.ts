export const NOTE_LABEL_COLORS = [
  "blue",
  "green",
  "teal",
  "orange",
  "purple",
  "pink",
  "yellow",
  "red",
  "gray",
] as const;

export type NoteLabelColor = (typeof NOTE_LABEL_COLORS)[number];

export type NoteLabel = {
  id: string;
  name: string;
  color: NoteLabelColor;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  labelIds: string[];
  archived: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotesView = "notes" | "archive" | "labels";

export type NoteDraft = {
  title: string;
  content: string;
  imageUrl?: string | null;
  labelIds: string[];
};

export type NotesLayoutMode = "grid" | "list";
