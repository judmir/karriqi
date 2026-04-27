export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="text-muted-foreground text-[0.7rem] font-medium tracking-[0.12em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground max-w-prose text-sm leading-relaxed md:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}
