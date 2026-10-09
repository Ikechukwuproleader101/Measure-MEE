import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock Supabase clients before importing app
vi.mock('../src/config/supabase.js', () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
    createUserClient: vi.fn(),
  };
});

import app from '../src/app.js';
import { supabaseAdmin, createUserClient } from '../src/config/supabase.js';

describe('Auth Middleware & Health Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok and uptime without requiring authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('requireAuth middleware', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
        },
      });
    });

    it('returns 401 when Authorization header does not use Bearer format', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Basic 123456');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when Supabase reports invalid or expired token', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid JWT'),
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    });

    it('returns 200 and fetches profile when token is valid and user is active', async () => {
      const mockUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        app_metadata: { role: 'user' },
      };

      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // supabaseAdmin.from('profiles').select('deleted_at')... for soft-delete check
      supabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { deleted_at: null },
              error: null,
            }),
          }),
        }),
      });

      // Mock createUserClient repository queries
      const mockUserClient = {
        from: vi.fn((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: mockUser.id,
                      email: mockUser.email,
                      full_name: 'Jane Doe',
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'user_settings') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { locale: 'en', timezone: 'UTC' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'user_roles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ roles: { name: 'user' } }],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      createUserClient.mockReturnValueOnce(mockUserClient);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(mockUser.id);
      expect(res.body.profile.full_name).toBe('Jane Doe');
      expect(res.body.roles).toContain('user');
    });
  });
});
