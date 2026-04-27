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
        "mx-auto w-full p-4 md:p-6",
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
