import { z } from "zod";

/** ─── Invoice header ─────────────────────────────────────────────── */
export const InvoiceHeaderPayload = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  supplier_id: z.string().uuid().nullable().optional(),

  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().datetime(),
  status: z.enum(["imported", "validated", "error"]),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),

  subtotal_excl_cents: z.number().int().nonnegative().nullable().optional(),
  total_vat_cents: z.number().int().nonnegative().nullable().optional(),
  total_incl_cents: z.number().int().nonnegative().nullable().optional(),
  meta_rounding_diff_cents: z.number().int().nonnegative().nullable().optional(),
});

export type InvoiceHeaderPayload = z.infer<typeof InvoiceHeaderPayload>;

/** ─── Invoice line ──────────────────────────────────────────────── */
export const InvoiceLinePayload = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  description: z.string(),
  raw_label: z.string().optional(),

  quantity: z.number().positive(),
  unit_label: z.string(),
  unit_type: z.enum(["weight", "volume", "unit"]),
  unit_base_qty: z.number().positive(),

  unit_price_excl_cents: z.number().int().nonnegative(),
  vat_rate: z.number().nonnegative(),
  vat_amount_cents: z.number().int().nonnegative(),
  line_total_excl_cents: z.number().int().nonnegative(),

  ingredient_match_id: z.string().uuid().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export type InvoiceLinePayload = z.infer<typeof InvoiceLinePayload>;

/** ─── Helper for upserts ───────────────────────────────────────── */
export const InvoiceUpsertLinesPayload = z.object({
  lines: z.array(InvoiceLinePayload),
});

export type InvoiceUpsertLinesPayload = z.infer<typeof InvoiceUpsertLinesPayload>;