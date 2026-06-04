/** Shared main-content slot below AppHeader (AppShell). */
export const MAIN_CONTENT_SLOT_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(6.25rem,calc(5rem+env(safe-area-inset-bottom)))] md:pb-0";

/** Calendar fills the main column height; sidebar stays visible (shadcn template style). */
export const CALENDAR_CONTENT_SLOT_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden pb-[max(6.25rem,calc(5rem+env(safe-area-inset-bottom)))] md:pb-0";
