import { redirect } from "next/navigation";

import { ApartmentViewer } from "@/components/home/apartment-viewer";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import { CICEROSTRASSE_WE28 } from "@/modules/home/cicerostrasse-we28";

export default async function HomePlannerPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.homePlanner)}`);
    }
  }

  const apartment = CICEROSTRASSE_WE28;

  return (
    <PageContainer width="wide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{apartment.label}</h1>
          <p className="text-muted-foreground text-sm">
            {apartment.address} · {apartment.totalAreaM2.toFixed(1)} m² · tap a
            room to plan and furnish it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Floorplan</CardTitle>
            <CardDescription>
              Positions and dimensions match the official plan. Click a room to
              design and furnish it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApartmentViewer apartment={apartment} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
