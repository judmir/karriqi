import type { WeekendPlannerPayload } from "@/modules/operator/weekend-planner-schema";
import type { Database } from "@/types/database";

export type OperatorEntryRow =
  Database["public"]["Tables"]["operator_entries"]["Row"];

/** Dashboard-ready weekend planner: DB row plus validated nested payload */
export type WeekendPlannerEntryView = {
  row: OperatorEntryRow;
  payload: WeekendPlannerPayload;
};
