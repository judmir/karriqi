"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApartmentStore } from "@/stores/apartment-store";
import type { ApartmentImage } from "@/types/apartment";

export function ApartmentImageManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const images = useApartmentStore((state) => state.images);
  const persistence = useApartmentStore((state) => state.persistence);
  const uploadImages = useApartmentStore((state) => state.uploadImages);
  const reorderImages = useApartmentStore((state) => state.reorderImages);

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }
    setUploading(true);
    const result = await uploadImages(files);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.message);
    } else if (!persistence) {
      toast.info("Photos kept locally only — they reset on reload.");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    void handleFiles(Array.from(event.dataTransfer.files));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = sorted.findIndex((image) => image.id === active.id);
    const newIndex = sorted.findIndex((image) => image.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const orderedIds = arrayMove(sorted, oldIndex, newIndex).map(
      (image) => image.id,
    );
    const result = await reorderImages(orderedIds);
    if (!result.ok) {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage photos</DialogTitle>
          <DialogDescription>
            Upload, caption, reorder (drag), set a cover, or delete photos.
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload photos"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground transition-colors",
            dragOver && "border-primary bg-primary/5 text-foreground",
          )}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-6" aria-hidden />
          )}
          <p>
            {uploading
              ? "Uploading…"
              : "Drag & drop images here, or click to choose files"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void handleFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </div>

        {sorted.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={sorted.map((image) => image.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {sorted.map((image) => (
                  <SortableImageRow key={image.id} image={image} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No photos yet.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SortableImageRow({ image }: { image: ApartmentImage }) {
  const updateImage = useApartmentStore((state) => state.updateImage);
  const setCoverImage = useApartmentStore((state) => state.setCoverImage);
  const deleteImage = useApartmentStore((state) => state.deleteImage);

  const [title, setTitle] = useState(image.title);
  const [caption, setCaption] = useState(image.caption ?? "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  async function commitMeta() {
    if (title === image.title && caption === (image.caption ?? "")) {
      return;
    }
    const result = await updateImage(image.id, {
      title,
      caption: caption.trim() === "" ? null : caption,
    });
    if (!result.ok) {
      toast.error(result.message);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-2",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label={`Reorder ${image.title || "photo"}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image.src ? (
          <Image
            src={image.src}
            alt={image.title || "Photo"}
            fill
            unoptimized
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Input
          value={title}
          placeholder="Title"
          className="h-7 text-sm"
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => void commitMeta()}
        />
        <Input
          value={caption}
          placeholder="Caption (optional)"
          className="h-7 text-xs"
          onChange={(event) => setCaption(event.target.value)}
          onBlur={() => void commitMeta()}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {image.isCover ? (
          <Badge variant="secondary">Cover</Badge>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Set as cover"
            onClick={async () => {
              const result = await setCoverImage(image.id);
              if (!result.ok) {
                toast.error(result.message);
              }
            }}
          >
            <Star />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete photo"
          onClick={async () => {
            const result = await deleteImage(image.id);
            if (!result.ok) {
              toast.error(result.message);
            }
          }}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
