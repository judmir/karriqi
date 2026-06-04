import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

import { pageRuntimeCaching } from "./lib/pwa/runtime-caching";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Default: PWA (service worker) is off in `next dev` for faster reloads. Set `ENABLE_PWA_IN_DEV=true` in `.env.local` to test Web Push locally. */
const disablePwa =
  process.env.NODE_ENV === "development" &&
  process.env.ENABLE_PWA_IN_DEV !== "true" &&
  process.env.ENABLE_PWA_IN_DEV !== "1";

const withPWA = withPWAInit({
  dest: "public",
  disable: disablePwa,
  register: true,
  scope: "/",
  /**
   * Extend (not replace) the built-in `defaultCache`. Our overrides add a
   * short `networkTimeoutSeconds` to the page/RSC NetworkFirst rules so a slow
   * network falls back to the cached shell quickly instead of hanging — see
   * `lib/pwa/runtime-caching.ts`.
   *
   * Web push: extend the generated service worker (custom worker / importScripts)
   * or add a `push` event listener in a future phase — see `lib/push/README.md`.
   */
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: pageRuntimeCaching,
  },
});

const nextConfig: NextConfig = {
  // Avoid picking a parent directory lockfile when multiple exist on the machine.
  outputFileTracingRoot: rootDir,
  // Allow dev over Herd proxy (http://karriqi.test → Next.js :3010).
  allowedDevOrigins: ["karriqi.test"],
  // Hide the floating Next.js dev tools badge so it does not obscure the app UI.
  devIndicators: false,
  experimental: {
    // Server Actions default to a 1 MB body cap; raise so todo attachments
    // (receipts, screenshots, PDFs) can be uploaded. Keep in sync with
    // MAX_ATTACHMENT_BYTES in lib/todo/todo-actions.ts.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withPWA(nextConfig);
