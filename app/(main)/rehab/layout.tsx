import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { canUseRehab } from "@/lib/rehab/rehab-access";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RehabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user || !canUseRehab(user)) {
      redirect(ROUTES.dashboard);
    }
  }

  return children;
}
