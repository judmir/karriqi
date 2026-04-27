import { cn } from "@/lib/utils";

export type PageContainerWidth = "narrow" | "wide";

const widthClass: Record<PageContainerWidth, string> = {
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export function PageContainer({
  children,
  className,
  width = "narrow",
}: {
  children: React.ReactNode;
  className?: string;
  width?: PageContainerWidth;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:px-6 md:py-8",
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
