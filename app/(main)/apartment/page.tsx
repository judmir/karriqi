import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ApartmentDashboard } from "@/components/apartment/apartment-dashboard";
import { ApartmentStoreGate } from "@/components/apartment/apartment-store-gate";
import { PageContainer } from "@/components/layout/page-container";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Apartment — Cicerostraße WE28",
};

export default async function ApartmentPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.apartment)}`);
    }
  }

  return (
    <PageContainer width="wide">
      <Suspense fallback={null}>
        <ApartmentStoreGate
          fallback={
            <div
              className="h-96 animate-pulse rounded-2xl border border-border/60 bg-muted/20"
              aria-label="Loading apartment dashboard"
              role="status"
            />
          }
        >
          <ApartmentDashboard />
        </ApartmentStoreGate>
      </Suspense>
    </PageContainer>
  );
}
