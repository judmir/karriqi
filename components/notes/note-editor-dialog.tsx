"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Archive,
  Bold,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Tag,
  Trash2,
  Underline,
} from "lucide-react";
import { toast } from "sonner";

import { NoteLabelBadge } from "@/components/notes/note-label-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { prefixTextareaLines, wrapTextareaSelection } from "@/lib/notes/format-text";
import { cn } from "@/lib/utils";
import type { Note, NoteDraft, NoteLabel } from "@/types/notes";

type NoteEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  labels: NoteLabel[];
  onSave: (draft: NoteDraft) => void;
  onDelete?: () => void;
  onArchive?: () => void;
};

function FormatButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground size-8"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

function NoteEditorForm({
  note,
  labels,
  onSave,
  onClose,
  onDelete,
  onArchive,
}: {
  note: Note | null;
  labels: NoteLabel[];
  onSave: (draft: NoteDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [imageUrl, setImageUrl] = useState(note?.imageUrl ?? "");
  const [labelIds, setLabelIds] = useState<string[]>(note?.labelIds ?? []);

  function applyFormat(
    wrap: (textarea: HTMLTextAreaElement) => string,
  ) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const next = wrap(textarea);
    setContent(next);
    requestAnimationFrame(() => textarea.focus());
  }

  function toggleLabel(id: string) {
    setLabelIds((current) =>
      current.includes(id)
        ? current.filter((labelId) => labelId !== id)
        : [...current, id],
    );
  }

  function handleSave() {
    onSave({
      title,
      content,
      imageUrl: imageUrl.trim() || null,
      labelIds,
    });
    onClose();
    toast.success(note ? "Note updated" : "Note created");
  }

  function handleAddImage() {
    const url = window.prompt("Image URL");
    if (url?.trim()) setImageUrl(url.trim());
  }

  function handleAddLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const url = window.prompt("Link URL");
    if (!url?.trim()) return;
    const selected = textarea.value.slice(
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    const label = selected || "link text";
    const markdownLink = `[${label}](${url.trim()})`;
    applyFormat((el) => wrapTextareaSelection(el, markdownLink, ""));
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="border-0 !bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0 dark:!bg-transparent"
        />
      </div>

      <div className="border-b border-border px-2 py-1.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-0.5">
          <FormatButton
            label="Bold"
            onClick={() => applyFormat((el) => wrapTextareaSelection(el, "**"))}
          >
            <Bold className="size-4" />
          </FormatButton>
          <FormatButton
            label="Italic"
            onClick={() => applyFormat((el) => wrapTextareaSelection(el, "*"))}
          >
            <Italic className="size-4" />
          </FormatButton>
          <FormatButton
            label="Underline"
            onClick={() => applyFormat((el) => wrapTextareaSelection(el, "<u>", "</u>"))}
          >
            <Underline className="size-4" />
          </FormatButton>
          <FormatButton
            label="Strikethrough"
            onClick={() => applyFormat((el) => wrapTextareaSelection(el, "~~"))}
          >
            <Strikethrough className="size-4" />
          </FormatButton>
          <FormatButton label="Insert link" onClick={handleAddLink}>
            <Link2 className="size-4" />
          </FormatButton>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <FormatButton
            label="Bulleted list"
            onClick={() => applyFormat((el) => prefixTextareaLines(el, "- "))}
          >
            <List className="size-4" />
          </FormatButton>
          <FormatButton
            label="Numbered list"
            onClick={() => applyFormat((el) => prefixTextareaLines(el, "1. "))}
          >
            <ListOrdered className="size-4" />
          </FormatButton>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-6">
        {imageUrl ? (
          <p className="text-muted-foreground mb-2 truncate text-xs">
            Image: {imageUrl}
          </p>
        ) : null}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Enter note description..."
          className="min-h-52 resize-y border-0 !bg-transparent px-0 shadow-none focus-visible:ring-0 dark:!bg-transparent"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Add image"
            onClick={handleAddImage}
          >
            <ImageIcon className="size-4" />
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Labels"
                />
              }
            >
              <Tag className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 space-y-2 p-3">
              <p className="text-sm font-medium">Labels</p>
              {labels.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Add labels from Edit Labels in the sidebar.
                </p>
              ) : (
                <div className="space-y-2">
                  {labels.map((label) => (
                    <label
                      key={label.id}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Checkbox
                        checked={labelIds.includes(label.id)}
                        onCheckedChange={() => toggleLabel(label.id)}
                      />
                      <NoteLabelBadge label={label} />
                    </label>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          {note && onArchive ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={note.archived ? "Unarchive" : "Archive"}
              onClick={onArchive}
            >
              <Archive className="size-4" />
            </Button>
          ) : null}
          {note && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete note"
              onClick={() => {
                onDelete();
                onClose();
                toast.success("Note deleted");
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
        <Button type="button" className="min-w-28" onClick={handleSave}>
          {note ? "Save" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  note,
  labels,
  onSave,
  onDelete,
  onArchive,
}: NoteEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn("gap-0 overflow-hidden p-0 sm:max-w-2xl")}
      >
        {open ? (
          <NoteEditorForm
            key={note?.id ?? "new"}
            note={note}
            labels={labels}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
