"use client";

import { useState } from "react";

import { PinSignInForm } from "@/components/auth/pin-sign-in-form";
import { SignInForm } from "@/components/auth/sign-in-form";

export function SignInSwitcher() {
  const [mode, setMode] = useState<"pin" | "email">("pin");

  if (mode === "email") {
    return (
      <div className="space-y-4">
        <SignInForm />
        <button
          type="button"
          onClick={() => setMode("pin")}
          className="text-muted-foreground hover:text-foreground w-full text-center text-xs underline-offset-4 hover:underline"
        >
          Use PIN instead
        </button>
      </div>
    );
  }

  return <PinSignInForm onUseEmail={() => setMode("email")} />;
}
