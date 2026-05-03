import { notFound } from "next/navigation";

import { ApartmentDetailView } from "@/components/apartments/apartment-detail-view";
import { PageContainer } from "@/components/layout/page-container";
import { isSupabaseConfigured } from "@/lib/env";
import {
  fetchApartmentFindingByIdForUser,
  markOperatorEntryViewed,
} from "@/lib/repositories/apartment-findings";
import { isUuid } from "@/lib/shopping/is-uuid";
import { createClient, getSessionUser } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentFindingPage({ params }: Props) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user) {
    notFound();
  }

  const supabase = await createClient();
  const found = await fetchApartmentFindingByIdForUser(supabase, user.id, id);
  if (!found) {
    notFound();
  }

  await markOperatorEntryViewed(supabase, user.id, id);

  return (
    <PageContainer width="wide">
      <ApartmentDetailView row={found.row} payload={found.payload} />
    </PageContainer>
  );
}
