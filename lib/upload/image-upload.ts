import { createClient } from "@/lib/supabase/client";

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code: "FILE_TOO_LARGE" | "INVALID_TYPE" | "UPLOAD_FAILED";
}

/**
 * Validates an image file before upload
 */
export function validateImage(file: File): UploadError | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      message: `File size must be under ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      code: "FILE_TOO_LARGE",
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      message: "Only JPEG, PNG, GIF, and WebP images are allowed",
      code: "INVALID_TYPE",
    };
  }

  return null;
}

/**
 * Uploads an image to Supabase Storage
 * Path format: {userId}/{projectId}/{timestamp}-{random}.{ext}
 */
export async function uploadImage(
  file: File,
  userId: string,
  projectId: string
): Promise<UploadResult> {
  const supabase = createClient();

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const path = `${userId}/${projectId}/${timestamp}-${random}.${ext}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from("uploads").remove([path]);

  if (error) {
    console.error("Failed to delete image:", error);
  }
}

/**
 * Creates a preview URL for a local file
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
