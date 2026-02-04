// Application constants

export const PLATFORMS = ["facebook", "instagram", "linkedin"] as const;

export const POST_STATUSES = [
  "draft",
  "publishing",
  "published",
  "failed",
  "partial",
] as const;

export const POST_RESULT_STATUSES = [
  "pending",
  "publishing",
  "success",
  "failed",
] as const;

export const MAX_POST_CONTENT_LENGTH = 5000;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export const FACEBOOK_API_VERSION = process.env.FACEBOOK_API_VERSION || "v19.0";

export const RATE_LIMITS = {
  posts: {
    maxPerMinute: 10,
    maxPerHour: 50,
    maxPerDay: 200,
  },
  comments: {
    maxRefreshPerMinute: 20,
  },
};

export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  backoffMultiplier: 2,
};

export const PAGINATION_DEFAULTS = {
  limit: 20,
  maxLimit: 100,
};
