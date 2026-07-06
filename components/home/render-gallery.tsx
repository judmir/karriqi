"use client";

import Image from "next/image";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useHomeStore } from "@/stores/home-store";

export function RenderGallery({ designId }: { designId: string }) {
  const generateRender = useHomeStore((s) => s.generateRender);
  const allRenders = useHomeStore((s) => s.renders);
  // Filter outside the store selector: a fresh array per snapshot would break
  // useSyncExternalStore's referential equality check (infinite loop).
  const renders = useMemo(
    () => allRenders.filter((r) => r.designId === designId),
    [allRenders, designId],
  );
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(() => {
      void (async () => {
        const result = await generateRender(designId);
        if (result.ok) toast.success("Render created.");
      })();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Inspiration renders</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={generate}
        >
          {pending ? "Rendering…" : "Generate render"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        AI style renders for inspiration — not to scale. The exact plan above is
        the source of truth.
      </p>
      {renders.length === 0 ? (
        <p className="text-muted-foreground text-sm">No renders yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {renders.map((render) =>
            render.url ? (
              <a
                key={render.id}
                href={render.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border block overflow-hidden rounded-lg border"
              >
                <Image
                  src={render.url}
                  alt="AI inspiration render"
                  width={512}
                  height={512}
                  className="h-auto w-full"
                  unoptimized
                />
              </a>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
