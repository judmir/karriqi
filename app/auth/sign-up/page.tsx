import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";

/** Self-service sign-up is disabled; accounts are created in the Supabase dashboard. */
export default function SignUpPage() {
  redirect(ROUTES.signIn);
}
