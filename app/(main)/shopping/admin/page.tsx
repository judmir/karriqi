import { PageHeader } from "@/components/patterns/page-header";
import { Section } from "@/components/patterns/section";
import { StapleCatalogSection } from "@/components/shopping/staple-catalog-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockStaples } from "@/lib/shopping/mock-staples";

export default function ShoppingAdminPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Shopping"
        title="Admin"
        description="Define staples, categories, units, and typical restock intervals. This catalog will feed suggested items and habit-style nudges in the next phase."
      />

      <StapleCatalogSection initialStaples={mockStaples} />

      <Section title="Purchase history and insights">
        <Card size="sm" className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Coming after persistence
            </CardTitle>
            <CardDescription>
              When checkoffs are saved, you will see purchase frequency and
              clearer &ldquo;you may need this soon&rdquo; hints—using last
              bought date and your typical interval per staple.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            No data yet; connect Supabase and list events to unlock this
            section.
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
