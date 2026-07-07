import { softDeletePatch } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/client";
import type { ApartmentImage } from "@/types/apartment";

export const APARTMENT_IMAGES_BUCKET = "apartment-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const IMAGE_ROW_SELECT =
  "id, storage_path, title, caption, is_cover, sort_order";

type ImageRow = {
  id: string;
  storage_path: string;
  title: string;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
};

function mapImageRow(row: ImageRow, src: string): ApartmentImage {
  return {
    id: row.id,
    storagePath: row.storage_path,
    src,
    title: row.title,
    caption: row.caption ?? undefined,
    isCover: row.is_cover,
    sortOrder: row.sort_order,
  };
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) {
    return fromName;
  }
  const fromType = file.type.split("/").pop();
  return fromType || "jpg";
}

export type UploadApartmentImageResult =
  | { ok: true; image: ApartmentImage }
  | { ok: false; message: string };

export async function uploadApartmentImageClient(input: {
  file: File;
  title: string;
  sortOrder: number;
  isCover?: boolean;
}): Promise<UploadApartmentImageResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  if (!input.file.type.startsWith("image/")) {
    return { ok: false, message: `${input.file.name} is not an image.` };
  }

  const imageId = crypto.randomUUID();
  const storagePath = `${user.id}/${imageId}.${fileExtension(input.file)}`;

  const { error: uploadError } = await supabase.storage
    .from(APARTMENT_IMAGES_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: row, error: insertError } = await supabase
    .from("apartment_images")
    .insert({
      id: imageId,
      user_id: user.id,
      storage_path: storagePath,
      title: input.title,
      is_cover: input.isCover ?? false,
      sort_order: input.sortOrder,
      mime_type: input.file.type,
      size_bytes: input.file.size,
    })
    .select(IMAGE_ROW_SELECT)
    .single();

  if (insertError || !row) {
    await supabase.storage.from(APARTMENT_IMAGES_BUCKET).remove([storagePath]);
    return { ok: false, message: insertError?.message ?? "Image save failed." };
  }

  const { data: signed } = await supabase.storage
    .from(APARTMENT_IMAGES_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  return {
    ok: true,
    image: mapImageRow(row as ImageRow, signed?.signedUrl ?? ""),
  };
}

export type UpdateApartmentImageResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateApartmentImageClient(input: {
  id: string;
  title?: string;
  caption?: string | null;
}): Promise<UpdateApartmentImageResult> {
  const supabase = createClient();
  const patch: { title?: string; caption?: string | null } = {};
  if (input.title !== undefined) {
    patch.title = input.title;
  }
  if (input.caption !== undefined) {
    patch.caption = input.caption;
  }

  const { error } = await supabase
    .from("apartment_images")
    .update(patch)
    .eq("id", input.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/** Marks one image as cover and clears the flag on the user's other images. */
export async function setApartmentCoverImageClient(
  id: string,
): Promise<UpdateApartmentImageResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  const { error: clearError } = await supabase
    .from("apartment_images")
    .update({ is_cover: false })
    .eq("user_id", user.id)
    .eq("is_cover", true)
    .is("deleted_at", null);
  if (clearError) {
    return { ok: false, message: clearError.message };
  }

  const { error } = await supabase
    .from("apartment_images")
    .update({ is_cover: true })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function reorderApartmentImagesClient(
  orderedIds: string[],
): Promise<UpdateApartmentImageResult> {
  const supabase = createClient();
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("apartment_images")
      .update({ sort_order: index })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) {
      return { ok: false, message: error.message };
    }
  }
  return { ok: true };
}

export async function deleteApartmentImageClient(input: {
  id: string;
  storagePath: string;
}): Promise<UpdateApartmentImageResult> {
  const supabase = createClient();

  if (input.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(APARTMENT_IMAGES_BUCKET)
      .remove([input.storagePath]);
    if (storageError) {
      return { ok: false, message: storageError.message };
    }
  }

  const { error } = await supabase
    .from("apartment_images")
    .update(softDeletePatch())
    .eq("id", input.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
