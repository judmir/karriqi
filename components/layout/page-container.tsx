import { cn } from "@/lib/utils";

export type PageContainerWidth = "narrow" | "wide";

const widthClass: Record<PageContainerWidth, string> = {
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export function PageContainer({
  children,
  className,
  width,
}: {
  children: React.ReactNode;
  className?: string;
  width?: PageContainerWidth;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full p-4 md:p-6",
        width ? widthClass[width] : "page-container-default",
        className,
      )}
    >
      {children}
    </div>
  );
}
