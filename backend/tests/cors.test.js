import { describe, it, expect, vi } from 'vitest';

// Configure environment BEFORE importing app and env modules
process.env.NODE_ENV = 'production';
process.env.CORS_ORIGINS = 'https://measure-me-app.vercel.app/,http://localhost:5174';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy-project.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'dummy-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
  createUserClient: vi.fn(),
}));

const { default: app } = await import('../src/app.js');
const { normalizeOrigin, env } = await import('../src/config/env.js');
const { default: request } = await import('supertest');

describe('CORS and Origin Configuration (Production)', () => {
  describe('normalizeOrigin & list parsing', () => {
    it('normalizes trailing slashes, spaces, uppercase, and empty values', () => {
      expect(normalizeOrigin('https://measure-me-app.vercel.app/')).toBe('https://measure-me-app.vercel.app');
      expect(normalizeOrigin('  https://MEASURE-ME-APP.vercel.app///  ')).toBe('https://measure-me-app.vercel.app');
      expect(normalizeOrigin('http://localhost:5174/')).toBe('http://localhost:5174');
      expect(normalizeOrigin('')).toBe('');
      expect(normalizeOrigin('   ')).toBe('');
      expect(normalizeOrigin(null)).toBe('');
      expect(normalizeOrigin(undefined)).toBe('');
    });

    it('parses corsOriginsList from CORS_ORIGINS without trailing slashes and drops empty items', () => {
      expect(env.corsOriginsList).toEqual([
        'https://measure-me-app.vercel.app',
        'http://localhost:5174',
      ]);
    });
  });

  describe('Preflight OPTIONS requests', () => {
    it('allows preflight from configured origin with PATCH and credentials', async () => {
      const res = await request(app)
        .options('/api/users/me')
        .set('Origin', 'https://measure-me-app.vercel.app')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('https://measure-me-app.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toBeDefined();
      expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    });

    it('blocks preflight from unknown origin without allow-origin header and without 500 error', async () => {
      const res = await request(app)
        .options('/api/users/me')
        .set('Origin', 'https://evil.example.com')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(res.status).not.toBe(500);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Simple requests', () => {
    it('returns 200 and access-control-allow-origin header on GET /health with allowed origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://measure-me-app.vercel.app');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.headers['access-control-allow-origin']).toBe('https://measure-me-app.vercel.app');
    });

    it('returns 200 on GET /health with no Origin header', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('returns 401 on unauthenticated GET /api/users/me', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
