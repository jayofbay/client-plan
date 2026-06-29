import { supabase } from "./supabase";

export const FOOD_PHOTOS_BUCKET = "food-photos";
export const PROGRESS_PHOTOS_BUCKET = "progress-photos";

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function getContentType(file) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const typeByExt = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return typeByExt[ext] || "image/jpeg";
}

function getExtension(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && Object.values(EXT_BY_TYPE).includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return EXT_BY_TYPE[getContentType(file)] || "jpg";
}

export function buildFoodPhotoPath(threadId, file) {
  const today = new Date().toISOString().split("T")[0];
  const ext = getExtension(file);
  return `${threadId}/${today}/${crypto.randomUUID()}.${ext}`;
}

export function buildProgressPhotoPath(threadId, angle, file) {
  const today = new Date().toISOString().split("T")[0];
  const ext = getExtension(file);
  return `${threadId}/progress/${today}/${angle}-${crypto.randomUUID()}.${ext}`;
}

export async function resolvePhotoUrl(bucket, photo) {
  if (!photo?.storage_path) {
    return photo?.public_url || null;
  }

  const { data: signed, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(photo.storage_path, 60 * 60 * 24);

  if (!error && signed?.signedUrl) {
    return signed.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(photo.storage_path);

  return publicData?.publicUrl || photo.public_url || null;
}

export async function enrichPhotosWithDisplayUrls(photos, bucket) {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      display_url: await resolvePhotoUrl(bucket, photo),
    }))
  );
}

export async function uploadPhotoToStorage(bucket, storagePath, file) {
  const contentType = getContentType(file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { contentType, upsert: false });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return publicData?.publicUrl || "";
}
