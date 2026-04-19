import Link from "next/link";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import { ROUTES } from "@/config/routes";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Link
            href={ROUTES.home}
            className="text-foreground hover:text-foreground/90 inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <KarriqiLogoMark className="size-11 text-primary" />
            <span className="text-xl font-semibold tracking-tight">Karriqi</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
