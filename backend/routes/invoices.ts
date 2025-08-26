import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';
import { requireOrgAccess } from '../middleware/requireOrgAccess';
import { InvoiceHeaderPayload, InvoiceLinePayload, InvoiceUpsertLinesPayload } from '../../shared/zod/invoice';
import { computeInvoiceTotals, getRoundingTolerance, validateInvoiceTotals } from '../services/invoiceTotalsService';
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
    const invoiceId = req.params.id;
    
    // Remove organization_id from body to prevent client tampering
    const { organization_id, ...bodyWithoutOrgId } = req.body;
    
    // Validate with Zod schema
    const validatedPayload = InvoiceHeaderPayload.parse(bodyWithoutOrgId);

    // Normalize invoice_date if it's a Date object
    if (validatedPayload.invoice_date instanceof Date) {
      validatedPayload.invoice_date = validatedPayload.invoice_date.toISOString();
    }

    // Validate totals if there are invoice lines
    const computed = await computeInvoiceTotals(invoiceId);
    const tolerance = getRoundingTolerance();
    
    if (computed.line_count > 0) {
      const validation = validateInvoiceTotals(validatedPayload, computed, tolerance);
      
      if (!validation.ok) {
        return res.status(422).json({
          error: "Invoice totals mismatch",
          details: {
            expected: validation.expected,
            received: validation.received,
            deltas: validation.deltas,
            tolerance_cents: tolerance
          }
        });
      }
    }

    // Update in database
    const { data, error } = await supabase
      .from('invoice')
      .update(validatedPayload)
      .eq('id', invoiceId)
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

// GET /invoices/:id/totals/check - Check invoice totals
router.get('/:id/totals/check', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    
    // Compute totals from lines
    const computed = await computeInvoiceTotals(invoiceId);
    const tolerance = getRoundingTolerance();
    
    // Get current header for validation
    const { data: header, error: headerError } = await supabase
      .from('invoice')
      .select('subtotal_excl_cents, total_vat_cents, total_incl_cents, meta_rounding_diff_cents')
      .eq('id', invoiceId)
      .single();

    if (headerError) throw headerError;

    let ok = true;
    let message: string | undefined;

    if (computed.line_count === 0) {
      ok = true;
    } else {
      const validation = validateInvoiceTotals(header, computed, tolerance);
      ok = validation.ok;
      if (!ok) {
        message = "Invoice totals mismatch";
      }
    }

    res.json({
      computed: {
        subtotal_excl_cents: computed.subtotal_excl_cents,
        total_vat_cents: computed.total_vat_cents,
        total_incl_cents_if_meta_0: computed.subtotal_excl_cents + computed.total_vat_cents
      },
      line_count: computed.line_count,
      tolerance_cents: tolerance,
      ok,
      ...(message && { message })
    });
  } catch (err) {
    next(err);
  }
});

// POST /invoices/:id/lines - Bulk replace invoice lines
router.post('/:id/lines', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    
    // Check payload size limit
    if (req.body.lines && req.body.lines.length > 1000) {
      return res.status(413).json({ error: 'Too many lines (max 1000)' });
    }

    // Normalize lines before validation
    const normalizedLines = (req.body.lines || []).map((line: any) => {
      const { id, invoice_id, ...rest } = line; // Remove client-provided id and invoice_id
      return {
        ...rest,
        description: rest.description?.trim?.() || rest.description,
        raw_label: rest.raw_label?.trim?.() || rest.raw_label
      };
    });

    // Validate with Zod schema
    const validatedPayload = InvoiceUpsertLinesPayload.parse({ lines: normalizedLines });

    // Force parent invoice_id for each line
    const linesToInsert = validatedPayload.lines.map(line => ({
      ...line,
      invoice_id: invoiceId
    }));

    // Replace operation: delete existing lines then insert new ones
    // Note: This is not atomic with Supabase JS, but acceptable for current requirements
    
    // 1. Delete existing lines
    const { error: deleteError } = await supabase
      .from('invoice_line')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) throw deleteError;

    // 2. Insert new lines (if any)
    let insertedLines = [];
    if (linesToInsert.length > 0) {
      const { data, error: insertError } = await supabase
        .from('invoice_line')
        .insert(linesToInsert)
        .select('*');

      if (insertError) throw insertError;
      insertedLines = data || [];
    }

    res.status(200).json({
      count: insertedLines.length,
      lines: insertedLines
    });
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

// PUT /invoices/:id/lines/:lineId - Update single invoice line
router.put('/:id/lines/:lineId', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    const lineId = req.params.lineId;

    // Normalize payload before validation
    const { id, invoice_id, ...bodyWithoutIds } = req.body;
    const normalizedPayload = {
      ...bodyWithoutIds,
      description: bodyWithoutIds.description?.trim?.() || bodyWithoutIds.description,
      raw_label: bodyWithoutIds.raw_label?.trim?.() || bodyWithoutIds.raw_label
    };

    // Validate with Zod schema
    const validatedPayload = InvoiceLinePayload.parse(normalizedPayload);

    // Force parent invoice_id
    const payloadWithInvoiceId = {
      ...validatedPayload,
      invoice_id: invoiceId
    };

    // Update in database
    const { data, error } = await supabase
      .from('invoice_line')
      .update(payloadWithInvoiceId)
      .eq('id', lineId)
      .eq('invoice_id', invoiceId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invoice line not found' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Invoice line not found' });
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

// DELETE /invoices/:id/lines/:lineId - Delete single invoice line
router.delete('/:id/lines/:lineId', requireOrgAccess('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    const lineId = req.params.lineId;

    // Delete with 404 detection
    const { data, error } = await supabase
      .from('invoice_line')
      .delete()
      .eq('id', lineId)
      .eq('invoice_id', invoiceId)
      .select('id');

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Invoice line not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;