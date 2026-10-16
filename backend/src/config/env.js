import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_ANON_KEY: z.string().min(1, { message: 'SUPABASE_ANON_KEY is required' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),
  CORS_ORIGINS: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '').toLowerCase();
}

// Parse allowed origins from environment variables (CORS_ORIGINS or FRONTEND_URL) or default to localhost
const originSources = [parsed.data.CORS_ORIGINS, parsed.data.FRONTEND_URL].filter(Boolean);
const rawOrigins = originSources.length > 0
  ? originSources.join(',')
  : (parsed.data.NODE_ENV === 'production' ? '' : 'http://localhost:5174,http://localhost:5173,http://localhost:3000');

const corsOriginsList = rawOrigins
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

if (parsed.data.NODE_ENV === 'production' && corsOriginsList.length === 0) {
  console.warn('No CORS origins configured; all browser requests from other origins will be blocked.');
}

export const env = {
  ...parsed.data,
  corsOriginsList,
};
