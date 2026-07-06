/**
 * Minimal server-side OpenAI REST client (plain fetch, no SDK dependency).
 * Used by the Home planner for: API-key validation, structured furnishing-plan
 * generation, and inspiration render images. Never import from client code —
 * it handles the raw API key.
 */

const OPENAI_BASE = "https://api.openai.com/v1";

export type OpenAiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/** Lightweight validation: the key can list models. */
export async function testOpenAiKey(apiKey: string): Promise<OpenAiResult<true>> {
  try {
    const res = await fetch(`${OPENAI_BASE}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) {
      return { ok: false, message: "OpenAI rejected this key (unauthorized)." };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `OpenAI returned ${res.status} while validating the key.`,
      };
    }
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Could not reach OpenAI to validate the key.",
    };
  }
}

/**
 * Chat Completions call constrained to a JSON schema (structured output).
 * Returns the parsed JSON object from the first choice.
 */
export async function createStructuredCompletion(input: {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<OpenAiResult<unknown>> {
  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model ?? "gpt-4o",
        temperature: 0.4,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: input.schemaName,
            strict: true,
            schema: input.schema,
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await safeErrorDetail(res);
      return { ok: false, message: `OpenAI error ${res.status}: ${detail}` };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, message: "OpenAI returned an empty response." };
    }
    try {
      return { ok: true, data: JSON.parse(content) };
    } catch {
      return { ok: false, message: "OpenAI returned invalid JSON." };
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "OpenAI request failed.",
    };
  }
}

/** Generate a single image, returned as raw PNG bytes. */
export async function generateImageBytes(input: {
  apiKey: string;
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  model?: string;
}): Promise<OpenAiResult<Uint8Array>> {
  try {
    const res = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model ?? "gpt-image-1",
        prompt: input.prompt,
        size: input.size ?? "1024x1024",
        n: 1,
      }),
    });

    if (!res.ok) {
      const detail = await safeErrorDetail(res);
      return { ok: false, message: `OpenAI image error ${res.status}: ${detail}` };
    }

    const json = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const first = json.data?.[0];
    if (first?.b64_json) {
      return { ok: true, data: Buffer.from(first.b64_json, "base64") };
    }
    if (first?.url) {
      const imgRes = await fetch(first.url);
      if (!imgRes.ok) {
        return { ok: false, message: "Could not download generated image." };
      }
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      return { ok: true, data: buf };
    }
    return { ok: false, message: "OpenAI returned no image data." };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "OpenAI image request failed.",
    };
  }
}

async function safeErrorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
