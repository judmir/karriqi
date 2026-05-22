import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/** Side-effect: enables `.openapi()` on Zod schemas for OpenAPI generation. */
extendZodWithOpenApi(z);

export { z };
