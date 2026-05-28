"use client";

import { useState } from "react";

import { DevSignInPicker } from "@/components/auth/dev-sign-in-picker";
import { PinSignInForm } from "@/components/auth/pin-sign-in-form";
import { SignInForm } from "@/components/auth/sign-in-form";

export function SignInSwitcher({
  devQuickSignIn = false,
}: {
  devQuickSignIn?: boolean;
}) {
  const [mode, setMode] = useState<"pin" | "email">("pin");

  if (mode === "email") {
    return (
      <div className="space-y-4">
        {devQuickSignIn ? <DevSignInPicker /> : null}
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

  return (
    <div className="space-y-4">
      {devQuickSignIn ? <DevSignInPicker /> : null}
      <PinSignInForm onUseEmail={() => setMode("email")} />
    </div>
  );
}
