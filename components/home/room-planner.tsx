"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DesignList } from "@/components/home/design-list";
import { DesignPromptForm } from "@/components/home/design-prompt-form";
import { RenderGallery } from "@/components/home/render-gallery";
import { RoomPlanSvg } from "@/components/home/room-plan-svg";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { getRoom } from "@/modules/home/cicerostrasse-we28";
import { useHomeStore } from "@/stores/home-store";

const RoomScene = dynamic(
  () => import("@/components/home/three/room-scene").then((m) => m.RoomScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-muted/30 h-full w-full animate-pulse rounded-lg"
        role="status"
        aria-label="Loading 3D room"
      />
    ),
  },
);

export function RoomPlanner({ roomId }: { roomId: string }) {
  const room = getRoom(roomId);
  const allDesigns = useHomeStore((s) => s.designs);
  // Filter outside the store selector: a fresh array per snapshot would break
  // useSyncExternalStore's referential equality check (infinite loop).
  const designs = useMemo(
    () => allDesigns.filter((d) => d.roomId === roomId),
    [allDesigns, roomId],
  );
  const [pickedId, setPickedId] = useState<string | null>(null);

  // Derive the active selection: the user's pick if still present, else newest.
  const selectedId =
    pickedId && designs.some((d) => d.id === pickedId)
      ? pickedId
      : (designs[0]?.id ?? null);

  if (!room) {
    return (
      <p className="text-muted-foreground text-sm">
        Unknown room.{" "}
        <Link href={ROUTES.homePlanner} className="underline">
          Back to floorplan
        </Link>
      </p>
    );
  }

  const selected = designs.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{room.name}</span>
              <span className="text-muted-foreground text-sm font-normal">
                {room.widthCm / 100} × {room.depthCm / 100} m ·{" "}
                {room.officialAreaM2.toFixed(1)} m²
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs defaultValue="3d">
              <div className="flex items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="3d">3D</TabsTrigger>
                  <TabsTrigger value="2d">2D plan</TabsTrigger>
                </TabsList>
                <p className="text-muted-foreground hidden text-xs sm:block">
                  Drag to rotate · scroll to zoom
                </p>
              </div>
              <TabsContent value="3d">
                <div className="relative h-[360px] w-full overflow-hidden rounded-lg sm:h-[460px] lg:h-[540px]">
                  <RoomScene room={room} layout={selected?.layout ?? null} />
                  {/* interaior-style floating prompt */}
                  <div className="bg-background/85 border-border absolute bottom-3 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 rounded-xl border p-2 shadow-lg backdrop-blur">
                    <DesignPromptForm
                      roomId={roomId}
                      onCreated={setPickedId}
                      variant="overlay"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="2d">
                <div className="bg-background rounded-lg p-2">
                  <RoomPlanSvg room={room} layout={selected?.layout ?? null} />
                </div>
              </TabsContent>
            </Tabs>
            {selected?.warnings.length ? (
              <div className="border-border rounded-lg border border-dashed p-3">
                <p className="text-sm font-medium">Layout warnings</p>
                <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {selected.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Designs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DesignList
                designs={designs}
                selectedId={selectedId}
                onSelect={setPickedId}
              />
              <DesignPromptForm roomId={roomId} onCreated={setPickedId} />
            </CardContent>
          </Card>

          {selected ? (
            <Card>
              <CardContent className="pt-6">
                <RenderGallery designId={selected.id} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
