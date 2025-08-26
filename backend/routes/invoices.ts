import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';
import { requireOrgAccess } from '../middleware/requireOrgAccess';
import { InvoiceHeaderPayload } from '../../shared/zod/invoice';
import { ZodError } from 'zod';

const router = Router();

// Helper function to get user's organization ID
async function getUserOrganizationId(userId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  if (!profile?.organization_id) {
    throw new Error('Organization not found');
  }

  return profile.organization_id;
}

// POST /invoices - Create invoice header
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's organization ID and force it in payload
    const userOrgId = await getUserOrganizationId(userId);
    const payload = {
      ...req.body,
      organization_id: userOrgId
    };

    // Validate with Zod schema
    const validatedPayload = InvoiceHeaderPayload.parse(payload);

    // Normalize invoice_date if it's a Date object
    if (validatedPayload.invoice_date instanceof Date) {
      validatedPayload.invoice_date = validatedPayload.invoice_date.toISOString();
    }

    // Insert into database
    const { data, error } = await supabase
      .from('invoice')
      .insert(validatedPayload)
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: err.errors 
      });
    }
    next(err);
  }
});

// GET /invoices - List invoices with pagination and filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's organization ID
    const userOrgId = await getUserOrganizationId(userId);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.page_size as string) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query with organization filter (always applied)
    let query = supabase
      .from('invoice')
      .select('*', { count: 'exact' })
      .eq('organization_id', userOrgId)
      .order('invoice_date', { ascending: false })
      .range(from, to);

    // Apply optional filters
    if (req.query.date_from) {
      query = query.gte('invoice_date', req.query.date_from as string);
    }
    if (req.query.date_to) {
      query = query.lte('invoice_date', req.query.date_to as string);
    }
    if (req.query.supplier_id) {
      query = query.eq('supplier_id', req.query.supplier_id as string);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status as string);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data: data || [],
      page,
      page_size: pageSize,
      total: count || 0
    });
  } catch (err) {
    next(err);
  }
});

// GET /invoices/:id - Get single invoice
router.get('/:id', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('invoice')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /invoices/:id - Update invoice header
router.put('/:id', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Remove organization_id from body to prevent client tampering
    const { organization_id, ...bodyWithoutOrgId } = req.body;
    
    // Validate with Zod schema
    const validatedPayload = InvoiceHeaderPayload.parse(bodyWithoutOrgId);

    // Normalize invoice_date if it's a Date object
    if (validatedPayload.invoice_date instanceof Date) {
      validatedPayload.invoice_date = validatedPayload.invoice_date.toISOString();
    }

    // Update in database
    const { data, error } = await supabase
      .from('invoice')
      .update(validatedPayload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: err.errors 
      });
    }
    next(err);
  }
});

// DELETE /invoices/:id - Delete invoice
router.delete('/:id', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('invoice')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;