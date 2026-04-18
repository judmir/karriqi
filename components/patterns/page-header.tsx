export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
        {description}
      </p>
    </header>
  );
}
