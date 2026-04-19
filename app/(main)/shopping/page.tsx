import { ShoppingTripClient } from "@/components/shopping/shopping-trip-client";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchRecentPurchaseEventsForCadence } from "@/lib/shopping/fetch-recent-purchase-events";
import { fetchShoppingListForUser } from "@/lib/shopping/fetch-shopping-list";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
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

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      try {
        staples = await fetchStaplesWithDefaults();
        purchasePersistence = true;
      } catch {
        staples = mockStaples;
        purchasePersistence = false;
      }

      if (purchasePersistence) {
        try {
          listItems = await fetchShoppingListForUser();
          listPersistence = true;
        } catch {
          listItems = [];
          listPersistence = false;
        }

        try {
          const events = await fetchRecentPurchaseEventsForCadence();
          medianIntervalByStapleId = medianGapDaysByStaple(events);
        } catch {
          medianIntervalByStapleId = {};
        }
      }
    }
  }

  return (
    <ShoppingTripClient
      initialItems={listItems}
      staples={staples}
      purchasePersistence={purchasePersistence}
      listPersistence={listPersistence}
      medianIntervalByStapleId={medianIntervalByStapleId}
    />
  );
}
