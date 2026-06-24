/**
 * Minimal shape of a Workbox runtime-caching entry (the `workbox-build`
 * `RuntimeCaching` type is not resolvable from this package's tsconfig). Kept
 * local and intentionally loose; consumed by `@ducanh2912/next-pwa`.
 */
type RouteMatchArgs = {
  request: Request;
  url: URL;
  sameOrigin: boolean;
};

type PageRuntimeCaching = {
  urlPattern: (args: RouteMatchArgs) => boolean;
  handler: "NetworkFirst";
  options: {
    cacheName: string;
    networkTimeoutSeconds: number;
    expiration: { maxEntries: number; maxAgeSeconds: number };
  };
};

/**
 * Page-document caching overrides for the service worker.
 *
 * The `@ducanh2912/next-pwa` `defaultCache` already caches static assets
 * (JS/CSS/fonts/images) and uses NetworkFirst for page documents / RSC. The
 * default NetworkFirst rules have **no** `networkTimeoutSeconds`, so on a slow
 * or flaky connection the worker waits indefinitely for the network before
 * serving the cached shell — which feels like a slow app open.
 *
 * These overrides keep NetworkFirst (so authenticated HTML stays fresh and we
 * never serve another session's cached page when online) but fall back to the
 * cached shell after a short timeout. Each entry reuses the default
 * `cacheName`, so with `extendDefaultRuntimeCaching: true` it replaces the
 * matching default rule.
 */
/** Fall back to cached shell quickly on slow mobile / PWA cold opens. */
const PAGE_NETWORK_TIMEOUT_SECONDS = 1.5;

const pageExpiration = { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 };

export const pageRuntimeCaching: PageRuntimeCaching[] = [
  {
    urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-rsc-prefetch",
      networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
      expiration: pageExpiration,
    },
  },
  {
    urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-rsc",
      networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
      expiration: pageExpiration,
    },
  },
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages",
      networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
      expiration: pageExpiration,
    },
  },
];
