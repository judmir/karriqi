import { cn } from "@/lib/utils";

export function Section({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title ? (
        <h2 className="text-foreground text-sm font-medium">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
