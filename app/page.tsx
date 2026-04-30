import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { getSessionUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getSessionUser();

  redirect(user ? ROUTES.dashboard : ROUTES.signIn);
}
