import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

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

describe('User Module & Role Guards', () => {
  const regularUser = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    app_metadata: { role: 'user' },
  };

  const adminUser = {
    id: 'admin-uuid-1',
    email: 'admin@example.com',
    app_metadata: { role: 'admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Soft-deleted user guard', () => {
    it('returns 403 with code ACCOUNT_DELETED when account is soft-deleted', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

      // deleted_at is set
      supabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { deleted_at: '2026-10-09T10:00:00Z' },
              error: null,
            }),
          }),
        }),
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer token-deleted-account');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'ACCOUNT_DELETED',
          message: 'This account has been deleted',
        },
      });
    });
  });

  describe('PATCH /api/users/me validation', () => {
    it('rejects unknown fields with 400 VALIDATION_ERROR', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

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

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          full_name: 'John Doe',
          some_unknown_field: 'malicious-data',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Unknown fields');
    });

    it('rejects attempt to modify email address with 400 VALIDATION_ERROR', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

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

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'hacked@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('successfully updates allowed profile fields', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

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

      const mockUserClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: regularUser.id,
                    full_name: 'Updated Name',
                    phone: '+1234567890',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      createUserClient.mockReturnValueOnce(mockUserClient);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          full_name: 'Updated Name',
          phone: '+1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.full_name).toBe('Updated Name');
    });
  });

  describe('requireRole guard (/api/admin/users)', () => {
    it('blocks regular non-admin user with 403 FORBIDDEN', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

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

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer regular-token');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: requires admin role',
        },
      });
    });

    it('allows admin user and returns paginated users list', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: adminUser },
        error: null,
      });

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

      supabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockReturnValueOnce({
            range: vi.fn().mockResolvedValueOnce({
              data: [{ id: 'user-1', email: 'user1@example.com' }],
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });
  });

  describe('DELETE /api/users/me (Soft delete)', () => {
    it('soft deletes user and returns success response', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: regularUser },
        error: null,
      });

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

      // Mock soft delete update
      supabaseAdmin.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            select: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: regularUser.id, deleted_at: '2026-10-09T13:00:00Z' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock audit log insert
      supabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      });

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Account deleted successfully');
    });
  });
});
