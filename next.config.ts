import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  /**
   * Workbox precaches build assets. Keep defaults for the scaffold; tune
   * `runtimeCaching` when you add offline-first flows.
   *
   * Web push: extend the generated service worker (custom worker / importScripts)
   * or add a `push` event listener in a future phase — see `lib/push/README.md`.
   */
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Avoid picking a parent directory lockfile when multiple exist on the machine.
  outputFileTracingRoot: rootDir,
};

export default withPWA(nextConfig);
