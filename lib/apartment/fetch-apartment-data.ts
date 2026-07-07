import { createClient } from "@/lib/supabase/server";
import type {
  ApartmentImage,
  ApartmentRoom,
  ApartmentStepState,
} from "@/types/apartment";

export const APARTMENT_IMAGES_BUCKET = "apartment-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type ImageRow = {
  id: string;
  storage_path: string;
  title: string;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
};

export async function fetchApartmentImagesForUser(
  userId: string,
): Promise<ApartmentImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartment_images")
    .select("id, storage_path, title, caption, is_cover, sort_order")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  const rows = data as ImageRow[];
  const paths = rows.map((row) => row.storage_path);
  const { data: signed } = await supabase.storage
    .from(APARTMENT_IMAGES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const urlByPath = new Map(
    (signed ?? [])
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl] as const),
  );

  return rows.map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    src: urlByPath.get(row.storage_path) ?? "",
    title: row.title,
    caption: row.caption ?? undefined,
    isCover: row.is_cover,
    sortOrder: row.sort_order,
  }));
}

export async function fetchApartmentNotesForUser(
  userId: string,
): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apartment_notes")
    .select("content")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return data?.content ?? "";
}

export async function fetchApartmentStepStatesForUser(
  userId: string,
): Promise<ApartmentStepState[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apartment_step_states")
    .select("kind, step_key, status, date, notes")
    .eq("user_id", userId)
    .is("deleted_at", null);

  return (data ?? []).map((row) => ({
    kind: row.kind as ApartmentStepState["kind"],
    stepKey: row.step_key,
    status: row.status as ApartmentStepState["status"],
    date: row.date,
    notes: row.notes,
  }));
}

export async function fetchApartmentRoomsForUser(
  userId: string,
): Promise<ApartmentRoom[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apartment_rooms")
    .select("id, name, area_m2, width_m, length_m, notes, sort_order")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    areaM2: row.area_m2 === null ? null : Number(row.area_m2),
    widthM: row.width_m === null ? null : Number(row.width_m),
    lengthM: row.length_m === null ? null : Number(row.length_m),
    notes: row.notes,
    sortOrder: row.sort_order,
    isApproximate: true,
  }));
}
