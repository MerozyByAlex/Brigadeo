import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import invoicesRouter from './invoices';

// Mock du client Supabase
const mockSupabase = {
  from: vi.fn()
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock du middleware requireOrgAccess
vi.mock('../middleware/requireOrgAccess', () => ({
  requireOrgAccess: vi.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Invoice Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authenticated user
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    app.use('/invoices', invoicesRouter);
    vi.clearAllMocks();
  });

  describe('POST /invoices', () => {
    it('should create invoice with user organization ID', async () => {
      // Mock profile lookup
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      };

      // Mock invoice insert
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { 
            id: 'invoice-123',
            organization_id: 'org-456',
            restaurant_id: 'rest-789',
            invoice_date: '2025-01-30T12:00:00Z',
            status: 'imported',
            currency: 'EUR'
          },
          error: null
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = await request(app)
        .post('/invoices')
        .send({
          restaurant_id: 'rest-789',
          invoice_date: '2025-01-30T12:00:00Z',
          status: 'imported',
          currency: 'EUR',
          organization_id: 'malicious-org' // Should be ignored
        });

      expect(response.status).toBe(201);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-456', // Forced to user's org
          restaurant_id: 'rest-789'
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/invoices', invoicesRouter);

      const response = await request(appNoAuth)
        .post('/invoices')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 422 for validation errors', async () => {
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockProfileQuery);

      const response = await request(app)
        .post('/invoices')
        .send({
          // Missing required fields
          currency: 'INVALID' // Invalid currency format
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /invoices', () => {
    it('should return paginated invoices for user organization', async () => {
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      };

      const mockInvoicesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            { id: 'invoice-1', organization_id: 'org-456' },
            { id: 'invoice-2', organization_id: 'org-456' }
          ],
          error: null,
          count: 2
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockInvoicesQuery);

      const response = await request(app).get('/invoices?page=1&page_size=10');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: expect.any(Array),
        page: 1,
        page_size: 10,
        total: 2
      });
      expect(mockInvoicesQuery.eq).toHaveBeenCalledWith('organization_id', 'org-456');
    });

    it('should apply filters correctly', async () => {
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      };

      const mockInvoicesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockInvoicesQuery);

      await request(app).get('/invoices?date_from=2025-01-01&date_to=2025-01-31&status=imported');

      expect(mockInvoicesQuery.gte).toHaveBeenCalledWith('invoice_date', '2025-01-01');
      expect(mockInvoicesQuery.lte).toHaveBeenCalledWith('invoice_date', '2025-01-31');
      expect(mockInvoicesQuery.eq).toHaveBeenCalledWith('status', 'imported');
    });
  });

  describe('GET /invoices/:id', () => {
    it('should return single invoice', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'invoice-123', organization_id: 'org-456' },
          error: null
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const response = await request(app).get('/invoices/invoice-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('invoice-123');
    });

    it('should return 404 when invoice not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const response = await request(app).get('/invoices/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Invoice not found' });
    });
  });

  describe('PUT /invoices/:id', () => {
    it('should update invoice and ignore organization_id from client', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { 
            id: 'invoice-123',
            status: 'validated',
            organization_id: 'org-456'
          },
          error: null
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const response = await request(app)
        .put('/invoices/invoice-123')
        .send({
          status: 'validated',
          organization_id: 'malicious-org' // Should be ignored
        });

      expect(response.status).toBe(200);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          organization_id: expect.anything()
        })
      );
    });

    it('should return 422 for validation errors', async () => {
      const response = await request(app)
        .put('/invoices/invoice-123')
        .send({
          currency: 'INVALID' // Invalid currency format
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /invoices/:id', () => {
    it('should delete invoice and return 204', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const response = await request(app).delete('/invoices/invoice-123');

      expect(response.status).toBe(204);
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'invoice-123');
    });
  });
});