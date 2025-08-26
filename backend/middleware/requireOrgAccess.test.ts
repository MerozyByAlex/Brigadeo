import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireOrgAccess } from './requireOrgAccess';

// Mock du client Supabase
const mockSupabase = {
  from: vi.fn()
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

describe('requireOrgAccess middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Route de test utilisant le middleware
    app.get('/test/:id', requireOrgAccess('invoice'), (req, res) => {
      res.status(200).json({ success: true });
    });

    // Reset des mocks
    vi.clearAllMocks();
  });

  it('should allow access when user belongs to same organization', async () => {
    // Mock de l'utilisateur connecté
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    // Mock du profil utilisateur
    const mockProfileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    // Mock de la ressource
    const mockResourceQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockResourceQuery);

    const response = await request(app).get('/test/invoice-789');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should return 403 when user belongs to different organization', async () => {
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const mockProfileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    const mockResourceQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-different' },
        error: null
      })
    };

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockResourceQuery);

    const response = await request(app).get('/test/invoice-789');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  it('should return 404 when resource does not exist', async () => {
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const mockProfileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    const mockResourceQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })
    };

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockResourceQuery);

    const response = await request(app).get('/test/nonexistent-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('should return 400 when resource id is missing', async () => {
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const response = await request(app).get('/test/');

    expect(response.status).toBe(404); // Express route not found
  });

  it('should return 401 when user is not authenticated', async () => {
    // Pas de req.user défini
    const response = await request(app).get('/test/invoice-789');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when user profile is not found', async () => {
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const mockProfileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    };

    mockSupabase.from.mockReturnValueOnce(mockProfileQuery);

    const response = await request(app).get('/test/invoice-789');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should work with custom idField', async () => {
    // Route de test avec un champ ID personnalisé
    app.get('/test-custom/:customId', requireOrgAccess('supplier', 'custom_id'), (req, res) => {
      res.status(200).json({ success: true });
    });

    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const mockProfileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    const mockResourceQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })
    };

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockResourceQuery);

    const response = await request(app).get('/test-custom/supplier-789');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    // Vérifier que le bon champ a été utilisé
    expect(mockResourceQuery.eq).toHaveBeenCalledWith('custom_id', 'supplier-789');
  });
});