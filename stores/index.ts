import { useCalendarStore } from "@/stores/calendar-store";
import { useNotesStore } from "@/stores/notes-store";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";
import { useShoppingStore } from "@/stores/shopping-store";
import { useTodoStore } from "@/stores/todo-store";

/** Clear all app data caches (e.g. on sign-out). */
export function resetAllStores(): void {
  useTodoStore.getState().reset();
  useCalendarStore.getState().reset();
  useShoppingStore.getState().reset();
  useNotesStore.getState().reset();
  useRehabPlanStore.getState().reset();
  useRuleOf3Store.getState().reset();
}

export {
  useCalendarStore,
  selectCalendarReady,
} from "@/stores/calendar-store";
export {
  useRehabPlanStore,
  selectRehabPlanReady,
} from "@/stores/rehab-plan-store";
export {
  useShoppingStore,
  selectShoppingReady,
} from "@/stores/shopping-store";
export { useTodoStore, selectKanbanReady } from "@/stores/todo-store";
export { useRuleOf3Store, selectRuleOf3Ready } from "@/stores/rule-of-3-store";
export { STORE_STALE_MS } from "@/stores/store-utils";
export { useNotesStore } from "@/stores/notes-store";
