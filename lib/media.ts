/**
 * Uploading photos and clips for the wall.
 *
 * Files land in the public `media` bucket created by supabase/storage.sql. The
 * URL that comes back is stored on the post; there is no cleanup pass, because
 * a re-seed drops the rows and the bucket is disposable with them.
 */

import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/types";

const BUCKET = "media";

/** Matches the bucket's own limit, so the check fails fast and locally. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export class MediaTooLargeError extends Error {
  constructor() {
    super("File is too large");
    this.name = "MediaTooLargeError";
  }
}

function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.startsWith("video/") ? "mp4" : "jpg";
}

export function mediaTypeOf(file: File): MediaType {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function uploadMedia(
  file: File,
): Promise<{ url: string; type: MediaType }> {
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaTooLargeError();

  const path = `${crypto.randomUUID()}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, type: mediaTypeOf(file) };
}
