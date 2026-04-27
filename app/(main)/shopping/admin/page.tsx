import { PageContainer } from "@/components/layout/page-container";
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
import { isSupabaseConfigured } from "@/lib/env";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
import { mockStaples } from "@/lib/shopping/mock-staples";
import { getSessionUser } from "@/lib/supabase/server";

export default async function ShoppingAdminPage() {
  let initialStaples = mockStaples;
  let persistCatalog = false;

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      try {
        initialStaples = await fetchStaplesWithDefaults();
        persistCatalog = true;
      } catch {
        initialStaples = mockStaples;
        persistCatalog = false;
      }
    }
  }

  const catalogKey = initialStaples.map((s) => s.id).join("|");

  return (
    <PageContainer width="wide">
      <div className="space-y-6">
        <PageHeader segments={["Shopping", "Admin"]} />

        <StapleCatalogSection
          key={catalogKey}
          initialStaples={initialStaples}
          persistCatalog={persistCatalog}
        />

        <Section title="Purchase history and insights">
          <Card size="sm" className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Coming later
              </CardTitle>
              <CardDescription>
                Purchase events are stored when you check items off the list.
                Charts and habit hints can build on that history next.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Query <code className="text-xs">purchase_events</code> in Supabase
              to inspect logs.
            </CardContent>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}
