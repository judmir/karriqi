import { z } from "@/modules/ingest/openapi/zod-openapi";
import { isoInstantSchema, uuidSchema } from "@/modules/ingest/primitives";
import { TODO_STATUSES } from "@/types/todo";

const todoStatusSchema = z.enum(TODO_STATUSES);

export const kanbanTaskIngestSchema = z
  .object({
    id: uuidSchema.optional()
      .meta({ description: "Existing task id for update; omit to create." }),
    title: z.string().min(1),
    status: todoStatusSchema.optional().meta({
      description: "Kanban column. Defaults to backlog.",
    }),
    category: z.union([z.string().min(1), z.null()]).optional(),
    description: z.union([z.string().min(1), z.null()]).optional(),
    dueAt: z.union([isoInstantSchema, z.null()]).optional(),
    progressPercent: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .meta({ description: "Ignored when status changes (column default applies)." }),
    assignedUserId: z.union([uuidSchema, z.null()]).optional(),
  })
  .strict();

export const kanbanIngestSchema = z
  .object({
    userId: uuidSchema,
    tasks: z.array(kanbanTaskIngestSchema).min(1).max(50),
  })
  .strict()
  .openapi("KanbanIngest");

export type KanbanIngestBody = z.infer<typeof kanbanIngestSchema>;
export type KanbanTaskIngest = z.infer<typeof kanbanTaskIngestSchema>;
