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

describe('Projects Module Endpoints (/api/projects)', () => {
  const regularUser = {
    id: 'b801a2f0-1d82-411a-8bb7-f2832860b29a',
    email: 'client@example.com',
    app_metadata: { role: 'user' },
  };

  const mockUserClient = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: valid auth token for regularUser, not soft-deleted
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: regularUser },
      error: null,
    });

    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { deleted_at: null },
            error: null,
          }),
        }),
      }),
    });

    createUserClient.mockReturnValue(mockUserClient);
  });

  describe('Authentication guard', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when token is invalid', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/projects', () => {
    it('returns empty array [] for a new user with no projects', async () => {
      mockUserClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              order: vi.fn().mockResolvedValueOnce({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns active projects and supports archived filter', async () => {
      const mockProject = {
        id: '2d8bb5d1-eaee-4f93-b68a-f74f7fc66d48',
        client_id: regularUser.id,
        name: 'Wedding Suit',
        status: 'pending_review',
        progress: 25,
        is_archived: false,
        created_at: '2026-11-19T10:00:00Z',
        measurements: [{ count: 0 }],
      };

      const orderMock = vi.fn().mockResolvedValueOnce({
        data: [mockProject],
        error: null,
      });
      const eqArchivedMock = vi.fn().mockReturnValueOnce({ order: orderMock });
      const eqClientMock = vi.fn().mockReturnValueOnce({ eq: eqArchivedMock });
      const selectMock = vi.fn().mockReturnValueOnce({ eq: eqClientMock });

      mockUserClient.from.mockReturnValueOnce({ select: selectMock });

      const res = await request(app)
        .get('/api/projects?archived=false')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Wedding Suit');
      expect(selectMock).toHaveBeenCalledWith('*, measurements(count)');
      expect(eqClientMock).toHaveBeenCalledWith('client_id', regularUser.id);
      expect(eqArchivedMock).toHaveBeenCalledWith('is_archived', false);
    });
  });

  describe('POST /api/projects', () => {
    it('rejects missing or empty project name with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects project name longer than 80 characters with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'a'.repeat(81) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects forbidden fields like status or client_id with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Valid Name', status: 'done', client_id: 'some-id' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates project with 201 using user id from token', async () => {
      const createdProject = {
        id: '2d8bb5d1-eaee-4f93-b68a-f74f7fc66d48',
        client_id: regularUser.id,
        name: 'Wedding Suit',
        status: 'pending_review',
        progress: 25,
        is_archived: false,
        created_at: '2026-11-19T10:00:00Z',
        measurements: [{ count: 0 }],
      };

      const singleMock = vi.fn().mockResolvedValueOnce({
        data: createdProject,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValueOnce({ single: singleMock });
      const insertMock = vi.fn().mockReturnValueOnce({ select: selectMock });

      mockUserClient.from.mockReturnValueOnce({ insert: insertMock });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Wedding Suit' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Wedding Suit');
      expect(insertMock).toHaveBeenCalledWith({
        client_id: regularUser.id,
        name: 'Wedding Suit',
      });
    });
  });

  describe('PATCH /api/projects/:id', () => {
    const projectId = '2d8bb5d1-eaee-4f93-b68a-f74f7fc66d48';

    it('rejects invalid uuid in params with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/not-a-uuid')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'New Name' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects attempts to modify status or unknown fields with 400', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'done' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('updates name and returns 200', async () => {
      const updatedProject = {
        id: projectId,
        client_id: regularUser.id,
        name: 'Renamed Suit',
        is_archived: false,
        measurements: [{ count: 0 }],
      };

      mockUserClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              select: vi.fn().mockReturnValueOnce({
                maybeSingle: vi.fn().mockResolvedValueOnce({
                  data: updatedProject,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Renamed Suit' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Renamed Suit');
    });

    it('archives a project and returns 200', async () => {
      const archivedProject = {
        id: projectId,
        client_id: regularUser.id,
        name: 'Wedding Suit',
        is_archived: true,
        measurements: [{ count: 0 }],
      };

      mockUserClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              select: vi.fn().mockReturnValueOnce({
                maybeSingle: vi.fn().mockResolvedValueOnce({
                  data: archivedProject,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ is_archived: true });

      expect(res.status).toBe(200);
      expect(res.body.is_archived).toBe(true);
    });

    it('returns 404 when project is not found or not owned by user', async () => {
      mockUserClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              select: vi.fn().mockReturnValueOnce({
                maybeSingle: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/projects/:id', () => {
    const projectId = '2d8bb5d1-eaee-4f93-b68a-f74f7fc66d48';

    it('returns single project with its measurements', async () => {
      const singleProject = {
        id: projectId,
        client_id: regularUser.id,
        name: 'Wedding Suit',
        measurements: [{ id: 'm1', description: 'Initial measurement' }],
      };

      mockUserClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: singleProject,
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(projectId);
      expect(res.body.measurements).toHaveLength(1);
    });

    it('returns 404 when project is not found', async () => {
      mockUserClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

