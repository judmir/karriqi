import { ShoppingTripClient } from "@/components/shopping/shopping-trip-client";
import { mockStaples } from "@/lib/shopping/mock-staples";

export default function ShoppingPage() {
  return <ShoppingTripClient initialItems={[]} staples={mockStaples} />;
}
