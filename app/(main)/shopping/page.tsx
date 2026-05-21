import { PageContainer } from "@/components/layout/page-container";
import { ShoppingTripClient } from "@/components/shopping/shopping-trip-client";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchRecentPurchaseEventsForCadence } from "@/lib/shopping/fetch-recent-purchase-events";
import { fetchShoppingListForUser } from "@/lib/shopping/fetch-shopping-list";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { mockStaples } from "@/lib/shopping/mock-staples";
import { medianGapDaysByStaple } from "@/lib/shopping/suggestions";
import { getSessionUser } from "@/lib/supabase/server";
import type { ShoppingListItem } from "@/types/shopping";

export default async function ShoppingPage() {
  let staples = mockStaples;
  let listItems: ShoppingListItem[] = [];
  let purchasePersistence = false;
  let listPersistence = false;
  let medianIntervalByStapleId: Record<string, number> = {};
  let householdOwnerId: string | null = null;

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const [ownerResult, staplesResult, listResult, eventsResult] =
        await Promise.allSettled([
          resolveHouseholdOwnerUserId(user.id),
          fetchStaplesWithDefaults(user.id),
          fetchShoppingListForUser(),
          fetchRecentPurchaseEventsForCadence(),
        ]);

      if (ownerResult.status === "fulfilled") {
        householdOwnerId = ownerResult.value;
      }

      if (staplesResult.status === "fulfilled") {
        staples = staplesResult.value;
        purchasePersistence = true;
      }

      if (listResult.status === "fulfilled") {
        listItems = listResult.value;
        listPersistence = true;
      }

      if (eventsResult.status === "fulfilled") {
        medianIntervalByStapleId = medianGapDaysByStaple(eventsResult.value);
      }
    }
  }

  return (
    <PageContainer width="wide">
      <ShoppingTripClient
        initialItems={listItems}
        staples={staples}
        purchasePersistence={purchasePersistence}
        listPersistence={listPersistence}
        medianIntervalByStapleId={medianIntervalByStapleId}
        householdOwnerId={householdOwnerId}
      />
    </PageContainer>
  );
}
