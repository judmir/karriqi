"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const safe = email.trim();
  const initials =
    safe.length >= 2
      ? safe.slice(0, 2).toUpperCase()
      : safe.toUpperCase() || "?";

  async function signOut() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.refresh();
      router.push("/auth/sign-in");
    } catch {
      toast.error("Could not sign out.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "ring-offset-background focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "hover:bg-muted text-muted-foreground hover:text-foreground",
        )}
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="text-muted-foreground block text-xs">Signed in</span>
            <span className="truncate text-sm">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
