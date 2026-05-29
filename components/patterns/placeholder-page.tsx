import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { Section } from "@/components/patterns/section";

export function PlaceholderPage({
  note,
}: {
  /** @deprecated Kept for call-site compatibility; the shell renders the page title. */
  segments?: string[];
  /** Muted line below the page title (e.g. unconfigured or signed-out hints). */
  note?: string;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        {note ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {note}
          </p>
        ) : null}
      </div>
      <Section title="Preview">
        <ListPlaceholder />
      </Section>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Coming in phase 2</CardTitle>
          <CardDescription>
            This module is not implemented yet. Routing and the app shell are
            ready for feature work.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Add domain logic under{" "}
          <code className="bg-muted rounded-md px-1.5 py-0.5 text-xs">
            modules/
          </code>{" "}
          and data access under{" "}
          <code className="bg-muted rounded-md px-1.5 py-0.5 text-xs">
            lib/repositories/
          </code>
          .
        </CardContent>
      </Card>
    </div>
  );
}
