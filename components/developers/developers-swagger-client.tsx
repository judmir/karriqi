"use client";

import { useEffect, useRef, useState } from "react";

import {
  OPENAPI_JSON_PATH,
  OPENAPI_YAML_PATH,
} from "@/modules/ingest/routes";

/** Pin a known-good Swagger UI dist (avoids Turbopack + swagger-ui-react apidom breakage). */
const SWAGGER_UI_VERSION = "5.18.2";
const SWAGGER_UI_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
const SWAGGER_UI_BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: {
      (config: Record<string, unknown>): unknown;
      presets: { apis: unknown };
    };
  }
}

function loadStylesheet(href: string, id: string): void {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function DevelopersSwaggerClient() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const rootId = "karriqi-swagger-ui";
    host.innerHTML = `<div id="${rootId}" class="min-h-[70vh]"></div>`;

    void (async () => {
      try {
        loadStylesheet(SWAGGER_UI_CSS, "karriqi-swagger-ui-css");
        await loadScript(SWAGGER_UI_BUNDLE, "karriqi-swagger-ui-bundle");

        if (cancelled) return;

        const SwaggerUIBundle = window.SwaggerUIBundle;
        if (!SwaggerUIBundle) {
          throw new Error("SwaggerUIBundle not available");
        }

        setLoading(false);
        SwaggerUIBundle({
          url: OPENAPI_JSON_PATH,
          dom_id: `#${rootId}`,
          deepLinking: true,
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
          persistAuthorization: true,
          tryItOutEnabled: true,
          presets: [SwaggerUIBundle.presets.apis],
          requestInterceptor: (req: { url?: string }) => {
            if (req.url?.startsWith("/")) {
              return { ...req, url: `${window.location.origin}${req.url}` };
            }
            return req;
          },
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load Swagger UI");
        }
      }
    })();

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, []);

  if (error) {
    return (
      <p className="text-destructive rounded-lg border p-4 text-sm">{error}</p>
    );
  }

  return (
    <div className="swagger-karriqi w-full overflow-hidden rounded-lg border bg-white text-black">
      {loading && !error ? (
        <p className="text-muted-foreground p-4 text-sm">Loading Swagger UI…</p>
      ) : null}
      <div ref={hostRef} />
      <p className="text-muted-foreground border-t bg-muted/30 px-3 py-2 text-xs">
        Spec downloads:{" "}
        <a className="underline" href={OPENAPI_JSON_PATH}>
          {OPENAPI_JSON_PATH}
        </a>
        {" · "}
        <a className="underline" href={OPENAPI_YAML_PATH}>
          {OPENAPI_YAML_PATH}
        </a>
      </p>
    </div>
  );
}
