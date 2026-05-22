import { z } from "@/modules/ingest/openapi/zod-openapi";
import { uuidSchema } from "@/modules/ingest/primitives";

export const shoppingListItemIngestSchema = z
  .object({
    id: uuidSchema
      .optional()
      .meta({
        description:
          "List row id. Omit to let Karriqi generate one (upsert by id when provided).",
      }),
    name: z.string().min(1).meta({ description: "Display name on the shopping list." }),
    stapleId: z
      .union([uuidSchema, z.null()])
      .optional()
      .meta({ description: "Optional link to a staples catalog row." }),
    quantity: z.union([z.string().min(1), z.null()]).optional(),
    checked: z.boolean().optional().meta({ description: "Defaults to false." }),
    position: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .meta({ description: "Sort order; defaults to 0." }),
  })
  .strict();

export const shoppingListIngestSchema = z
  .object({
    userId: uuidSchema,
    items: z
      .array(shoppingListItemIngestSchema)
      .min(1)
      .max(100)
      .meta({ description: "One or more list rows to upsert for the household." }),
  })
  .strict()
  .openapi("ShoppingListIngest");

export type ShoppingListIngestBody = z.infer<typeof shoppingListIngestSchema>;
export type ShoppingListItemIngest = z.infer<typeof shoppingListItemIngestSchema>;
