import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";

/** Stoic Path lives on Rehab Today as a daily task, not a standalone section. */
export default function RehabStoicPathRedirectPage() {
  redirect(ROUTES.rehabToday);
}
