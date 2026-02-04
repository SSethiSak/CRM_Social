import { z } from "zod";

export const platformSchema = z.enum(["facebook", "instagram", "linkedin"]);

export const postContentSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be less than 5000 characters"),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  platforms: z.array(platformSchema).min(1, "Select at least one platform"),
});

export const accountConnectionSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
});

export const commentRefreshSchema = z.object({
  postId: z.string().cuid("Invalid post ID"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function validateImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
}

export function validateVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}
