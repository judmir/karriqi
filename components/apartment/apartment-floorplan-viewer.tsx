"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAreaM2 } from "@/lib/apartment/apartment-utils";
import { useApartmentStore } from "@/stores/apartment-store";
import type { ApartmentRoom } from "@/types/apartment";

/**
 * Schematic 2D floorplan: rooms laid out in two rows, widths proportional to
 * area. This is NOT the real layout — the dimensioned floorplan PDF is the
 * authoritative source. Kept deliberately simple until exact dimensions are
 * entered per room.
 */
function SchematicFloorplan({ rooms }: { rooms: ApartmentRoom[] }) {
  const withArea = rooms.filter((room) => (room.areaM2 ?? 0) > 0);
  if (withArea.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add room areas to see the schematic floorplan.
      </p>
    );
  }

  const half = Math.ceil(withArea.length / 2);
  const rows = [withArea.slice(0, half), withArea.slice(half)];
  const width = 100;
  const rowHeight = 30;
  const gap = 1.2;

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length * rowHeight + gap}`}
      className="w-full rounded-xl border border-border bg-muted/20"
      role="img"
      aria-label="Schematic floorplan (approximate, not to scale)"
    >
      {rows.map((row, rowIndex) => {
        const rowTotal = row.reduce((sum, room) => sum + (room.areaM2 ?? 0), 0);
        let x = gap;
        return row.map((room) => {
          const roomWidth =
            ((room.areaM2 ?? 0) / rowTotal) * (width - gap * (row.length + 1));
          const rect = (
            <g key={room.id}>
              <rect
                x={x}
                y={rowIndex * rowHeight + gap}
                width={roomWidth}
                height={rowHeight - gap * 2}
                rx={1.5}
                className="fill-primary/10 stroke-primary/40"
                strokeWidth={0.4}
              />
              <text
                x={x + roomWidth / 2}
                y={rowIndex * rowHeight + rowHeight / 2 - 1}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={2.6}
              >
                {room.name.split(" (")[0]}
              </text>
              <text
                x={x + roomWidth / 2}
                y={rowIndex * rowHeight + rowHeight / 2 + 3.5}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={2.2}
              >
                ~{formatAreaM2(room.areaM2 ?? 0)}
              </text>
            </g>
          );
          x += roomWidth + gap;
          return rect;
        });
      })}
    </svg>
  );
}

export function ApartmentFloorplanViewer() {
  const rooms = useApartmentStore((state) => state.rooms);
  const deleteRoom = useApartmentStore((state) => state.deleteRoom);
  const [editing, setEditing] = useState<ApartmentRoom | "new" | null>(null);

  const sorted = [...rooms].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalArea = sorted.reduce((sum, room) => sum + (room.areaM2 ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Floorplan
          <Badge variant="outline">Approximate — manual dimensions</Badge>
        </CardTitle>
        <CardDescription>
          Room sizes are estimates until verified against the dimensioned
          floorplan PDF (2026-06). The schematic is not the real layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SchematicFloorplan rooms={sorted} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} rooms · ~{formatAreaM2(totalArea)} listed (unit:
            81,78 m²)
          </p>
          <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
            <Plus data-icon="inline-start" />
            Add room
          </Button>
        </div>

        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {sorted.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {room.areaM2 !== null ? `~${formatAreaM2(room.areaM2)}` : "—"}
                  {room.widthM !== null && room.lengthM !== null
                    ? ` · ${room.widthM} × ${room.lengthM} m`
                    : ""}
                  {room.notes ? ` · ${room.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${room.name}`}
                  onClick={() => setEditing(room)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${room.name}`}
                  onClick={async () => {
                    const result = await deleteRoom(room.id);
                    if (!result.ok) {
                      toast.error(result.message);
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <RoomEditDialog editing={editing} onClose={() => setEditing(null)} />
    </Card>
  );
}

function RoomEditDialog({
  editing,
  onClose,
}: {
  editing: ApartmentRoom | "new" | null;
  onClose: () => void;
}) {
  const upsertRoom = useApartmentStore((state) => state.upsertRoom);

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [widthM, setWidthM] = useState("");
  const [lengthM, setLengthM] = useState("");
  const [notes, setNotes] = useState("");

  const key = editing === null ? null : editing === "new" ? "new" : editing.id;
  if (key !== null && key !== loadedKey) {
    setLoadedKey(key);
    if (editing === "new") {
      setName("");
      setArea("");
      setWidthM("");
      setLengthM("");
      setNotes("");
    } else if (editing) {
      setName(editing.name);
      setArea(editing.areaM2?.toString() ?? "");
      setWidthM(editing.widthM?.toString() ?? "");
      setLengthM(editing.lengthM?.toString() ?? "");
      setNotes(editing.notes ?? "");
    }
  }
  if (key === null && loadedKey !== null) {
    setLoadedKey(null);
  }

  function parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Room name is required.");
      return;
    }
    const result = await upsertRoom({
      id: editing !== "new" && editing ? editing.id : undefined,
      name: name.trim(),
      areaM2: parseNumber(area),
      widthM: parseNumber(widthM),
      lengthM: parseNumber(lengthM),
      notes: notes.trim() || null,
      isApproximate: true,
    });
    if (!result.ok) {
      toast.error(result.message);
    } else {
      onClose();
    }
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing === "new" ? "Add room" : "Edit room"}</DialogTitle>
          <DialogDescription>
            Dimensions are treated as approximate/manual until verified against
            the floorplan PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="room-name">Room name</Label>
          <Input
            id="room-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Wohnzimmer (living room)"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-area">Area m²</Label>
            <Input
              id="room-area"
              inputMode="decimal"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-width">Width m</Label>
            <Input
              id="room-width"
              inputMode="decimal"
              value={widthM}
              onChange={(event) => setWidthM(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-length">Length m</Label>
            <Input
              id="room-length"
              inputMode="decimal"
              value={lengthM}
              onChange={(event) => setLengthM(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="room-notes">Notes</Label>
          <Textarea
            id="room-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void save()}>
            Save room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
