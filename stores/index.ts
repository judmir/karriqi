import { useNotesStore } from "@/stores/notes-store";
import { useShoppingStore } from "@/stores/shopping-store";
import { useTodoStore } from "@/stores/todo-store";

/** Clear all app data caches (e.g. on sign-out). */
export function resetAllStores(): void {
  useTodoStore.getState().reset();
  useShoppingStore.getState().reset();
  useNotesStore.getState().reset();
}

export {
  useShoppingStore,
  selectShoppingReady,
} from "@/stores/shopping-store";
export { useTodoStore, selectKanbanReady } from "@/stores/todo-store";
export { STORE_STALE_MS } from "@/stores/store-utils";
export { useNotesStore } from "@/stores/notes-store";
