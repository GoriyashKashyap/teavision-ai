// API base URL — overridden by VITE_API_URL in .env
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Model classes — must match backend exactly (index order is ground truth)
export const DISEASE_CLASSES = [
  'Tea algal leaf spot',
  'Brown Blight',
  'Gray Blight',
  'Helopeltis',
  'Red spider',
  'Green mirid bug',
  'Healthy leaf',
] as const;

export type DiseaseClass = typeof DISEASE_CLASSES[number];

// Upload constraints
export const MAX_FILE_SIZE_MB  = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Low-confidence threshold — show uncertainty note below this value
export const LOW_CONFIDENCE_THRESHOLD = 0.60;
