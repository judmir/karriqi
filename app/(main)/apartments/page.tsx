import { ApartmentsList } from "@/components/apartments/apartments-list";
import { PageContainer } from "@/components/layout/page-container";
import type { ApartmentFindingListItemView } from "@/lib/repositories/apartment-findings";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchApartmentFindingsForUser } from "@/lib/repositories/apartment-findings";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export default async function ApartmentsPage() {
  let listItems: ApartmentFindingListItemView[] = [];

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const supabase = await createClient();
      listItems = await fetchApartmentFindingsForUser(supabase, user.id);
    }
  }

  return (
    <PageContainer width="wide">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Apartments
          </h1>
          <p className="text-sm text-muted-foreground">
            Hermes evaluations for listings, newest first. Open a card to mark it as seen.
          </p>
        </header>
        <ApartmentsList items={listItems} />
      </div>
    </PageContainer>
  );
}
