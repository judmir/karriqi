"use client";

import dynamic from "next/dynamic";

import { ApartmentFloorplan } from "@/components/home/apartment-floorplan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Apartment } from "@/modules/home/apartment-model";

const ApartmentScene = dynamic(
  () =>
    import("@/components/home/three/apartment-scene").then(
      (m) => m.ApartmentScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-muted/30 h-full w-full animate-pulse rounded-lg"
        role="status"
        aria-label="Loading 3D floorplan"
      />
    ),
  },
);

/** 3D dollhouse (clickable rooms) with a 2D plan fallback tab. */
export function ApartmentViewer({ apartment }: { apartment: Apartment }) {
  return (
    <Tabs defaultValue="3d">
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="3d">3D</TabsTrigger>
          <TabsTrigger value="2d">2D plan</TabsTrigger>
        </TabsList>
        <p className="text-muted-foreground hidden text-xs sm:block">
          Drag to rotate · scroll to zoom · click a room to design it
        </p>
      </div>
      <TabsContent value="3d">
        <div className="h-[340px] w-full overflow-hidden rounded-lg sm:h-[440px] lg:h-[520px]">
          <ApartmentScene apartment={apartment} />
        </div>
      </TabsContent>
      <TabsContent value="2d">
        <div className="bg-background rounded-lg p-2">
          <ApartmentFloorplan apartment={apartment} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
