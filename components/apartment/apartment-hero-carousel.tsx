"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, ImagePlus } from "lucide-react";

import { ApartmentImageManager } from "@/components/apartment/apartment-image-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APARTMENT_PROPERTY } from "@/lib/apartment/cicerostrasse-we28-data";
import { cn } from "@/lib/utils";
import {
  orderApartmentImages,
  useApartmentStore,
} from "@/stores/apartment-store";


export function ApartmentHeroCarousel() {
  const rawImages = useApartmentStore((state) => state.images);
  const images = useMemo(() => orderApartmentImages(rawImages), [rawImages]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);

  const count = images.length;
  const safeIndex = count === 0 ? 0 : Math.min(activeIndex, count - 1);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) {
        return;
      }
      setActiveIndex(((index % count) + count) % count);
    },
    [count],
  );

  const active = images[safeIndex];

  return (
    <section aria-label="Apartment photos">
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[21/9]">
        {active && active.src ? (
          <Image
            key={active.id}
            src={active.src}
            alt={active.title || "Apartment photo"}
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <ImageIcon className="size-10" aria-hidden />
            <p className="text-sm">No photos yet</p>
            <Button size="sm" onClick={() => setManagerOpen(true)}>
              <ImagePlus data-icon="inline-start" />
              Add photos
            </Button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-16 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-heading truncate text-xl font-semibold sm:text-2xl">
                {APARTMENT_PROPERTY.name}
              </h1>
              <p className="truncate text-sm text-white/80">
                {APARTMENT_PROPERTY.address} · {APARTMENT_PROPERTY.floor} ·{" "}
                {APARTMENT_PROPERTY.profile}
              </p>
              {active?.caption ? (
                <p className="mt-1 truncate text-xs text-white/70">
                  {active.caption}
                </p>
              ) : null}
            </div>
            {active?.isCover ? (
              <Badge variant="secondary" className="shrink-0">
                Cover
              </Badge>
            ) : null}
          </div>
        </div>

        {count > 1 ? (
          <>
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 left-2 -translate-y-1/2 opacity-70 hover:opacity-100"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Previous photo"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2 opacity-70 hover:opacity-100"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Next photo"
            >
              <ChevronRight />
            </Button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  aria-label={`Go to photo ${index + 1}`}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    index === safeIndex ? "bg-white" : "bg-white/40",
                  )}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </>
        ) : null}

        {count > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 opacity-80 hover:opacity-100"
            onClick={() => setManagerOpen(true)}
          >
            <ImagePlus data-icon="inline-start" />
            Manage photos
          </Button>
        ) : null}
      </div>

      <ApartmentImageManager open={managerOpen} onOpenChange={setManagerOpen} />
    </section>
  );
}
