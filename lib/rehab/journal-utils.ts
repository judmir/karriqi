import { format } from "date-fns";

export function formatJournalDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
