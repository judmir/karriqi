import { mapDesignRow, mapRenderRow } from "@/lib/home/map-home-rows";
import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { DesignRender, RoomDesign } from "@/types/home";

const RENDERS_BUCKET = "home-renders";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** All active designs for the current user, newest first. */
export async function fetchRoomDesignsForUser(): Promise<RoomDesign[]> {
  const supabase = await createClient();
  const { data, error } = await withoutSoftDeleted(
    supabase
      .from("home_room_designs")
      .select(
        "id, room_id, apartment_id, title, style_prompt, layout, warnings, status, created_at, updated_at",
      ),
  ).order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapDesignRow);
}

/** All active renders for the current user, with short-lived signed URLs. */
export async function fetchDesignRendersForUser(): Promise<DesignRender[]> {
  const supabase = await createClient();
  const { data, error } = await withoutSoftDeleted(
    supabase
      .from("home_design_renders")
      .select("id, design_id, prompt, storage_path, created_at"),
  ).order("created_at", { ascending: false });

  if (error || !data) return [];

  const renders = await Promise.all(
    data.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(RENDERS_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return mapRenderRow(row, signed?.signedUrl ?? null);
    }),
  );
  return renders;
}

export async function fetchHomeDataForUser(): Promise<{
  designs: RoomDesign[];
  renders: DesignRender[];
}> {
  const user = await getSessionUser();
  if (!user) return { designs: [], renders: [] };
  const [designs, renders] = await Promise.all([
    fetchRoomDesignsForUser(),
    fetchDesignRendersForUser(),
  ]);
  return { designs, renders };
}
