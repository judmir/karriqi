import type { FurnitureItem } from "@/types/home";

/**
 * Build a shopping URL for a furniture item's suggested product.
 *
 * The AI suggests real product names (e.g. "KIVIK 3-seat sofa" at IKEA), but
 * exact product-page URLs would be guesses — a retailer search link is
 * reliable and lands the user on the right product list instead of a 404.
 */
export function furnitureShoppingUrl(item: FurnitureItem): string | null {
  const product = item.product?.trim();
  if (!product) return null;

  const retailer = item.retailer?.trim().toLowerCase() ?? "";
  const query = encodeURIComponent(product);

  if (retailer.includes("ikea")) {
    // German store — the apartment is in Berlin.
    return `https://www.ikea.com/de/de/search/?q=${query}`;
  }
  const retailerPrefix = item.retailer?.trim()
    ? `${encodeURIComponent(item.retailer.trim())}+`
    : "";
  return `https://www.google.com/search?tbm=shop&q=${retailerPrefix}${query}`;
}

/** Short display label for the shopping link, e.g. "IKEA ↗". */
export function shoppingLinkLabel(item: FurnitureItem): string {
  const retailer = item.retailer?.trim();
  return retailer ? `View at ${retailer}` : "Shop";
}
