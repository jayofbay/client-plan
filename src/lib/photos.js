import { supabase } from "./supabase";

export const FOOD_PHOTOS_BUCKET = "food-photos";
export const PROGRESS_PHOTOS_BUCKET = "progress-photos";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const preflightCache = new Map();

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

export function sanitizePathSegment(segment) {
  return (
    String(segment || "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}

export function validatePhotoFile(file) {
  if (!file) {
    throw new Error("No photo selected");
  }
  if (file.size === 0) {
    throw new Error("Photo file is empty — try retaking the photo");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Photo is too large (max 20 MB)");
  }
  if (!getContentType(file).startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
}

export function formatUploadError(err, context = "upload") {
  const msg = err?.message || String(err || "");
  const lower = msg.toLowerCase();

  if (lower.includes("bucket") && (lower.includes("not found") || lower.includes("missing"))) {
    return "Storage bucket missing — ask your coach to run storage_setup.sql in Supabase";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("permission") ||
    lower.includes("policy") ||
    lower.includes("not allowed")
  ) {
    return "Upload blocked by Supabase permissions — ask your coach to run storage_setup.sql";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "Database table missing — ask your coach to run storage_setup.sql in Supabase";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Invalid Supabase API key — check VITE_SUPABASE_ANON_KEY on deployment";
  }
  if (lower.includes("duplicate") || lower.includes("already exists")) {
    return "Upload conflict — please try again";
  }

  return msg || `Photo ${context} failed`;
}

export async function preflightPhotoUpload(bucket, table) {
  const cacheKey = `${bucket}:${table}`;
  if (preflightCache.has(cacheKey)) {
    return true;
  }

  const [tableResult, bucketResult] = await Promise.all([
    supabase.from(table).select("id").limit(1),
    supabase.storage.from(bucket).list("", { limit: 1 }),
  ]);

  if (tableResult.error) {
    throw new Error(formatUploadError(tableResult.error, "preflight"));
  }
  if (bucketResult.error) {
    throw new Error(formatUploadError(bucketResult.error, "preflight"));
  }

  preflightCache.set(cacheKey, true);
  return true;
}

export function buildFoodPhotoPath(threadId, file) {
  const today = new Date().toISOString().split("T")[0];
  const ext = getExtension(file);
  const safeThread = sanitizePathSegment(threadId);
  return `${safeThread}/${today}/${crypto.randomUUID()}.${ext}`;
}

export function buildProgressPhotoPath(threadId, angle, file) {
  const today = new Date().toISOString().split("T")[0];
  const ext = getExtension(file);
  const safeThread = sanitizePathSegment(threadId);
  const safeAngle = sanitizePathSegment(angle);
  return `${safeThread}/progress/${today}/${safeAngle}-${crypto.randomUUID()}.${ext}`;
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
  validatePhotoFile(file);

  const contentType = getContentType(file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { contentType, upsert: true });

  if (error) {
    throw new Error(formatUploadError(error, "upload"));
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return publicData?.publicUrl || "";
}
