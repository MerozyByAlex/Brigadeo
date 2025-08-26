import { supabase } from '../lib/supabaseClient';

export type ComputedTotals = {
  subtotal_excl_cents: number;
  total_vat_cents: number;
  line_count: number;
};

export type InvoiceHeader = {
  subtotal_excl_cents?: number | null;
  total_vat_cents?: number | null;
  total_incl_cents?: number | null;
  meta_rounding_diff_cents?: number | null;
};

export type ValidationResult = {
  ok: boolean;
  expected: {
    subtotal_excl_cents: number;
    total_vat_cents: number;
    total_incl_cents: number;
  };
  received: {
    subtotal_excl_cents: number;
    total_vat_cents: number;
    total_incl_cents: number;
    meta_rounding_diff_cents: number;
  };
  deltas: {
    subtotal_excl_cents: number;
    total_vat_cents: number;
    total_incl_cents: number;
  };
};

export async function computeInvoiceTotals(invoiceId: string): Promise<ComputedTotals> {
  const { data, error } = await supabase
    .from('invoice_line')
    .select('line_total_excl_cents, vat_amount_cents')
    .eq('invoice_id', invoiceId);

  if (error) throw error;

  const lines = data || [];
  
  const subtotal_excl_cents = lines.reduce((sum, line) => sum + (line.line_total_excl_cents || 0), 0);
  const total_vat_cents = lines.reduce((sum, line) => sum + (line.vat_amount_cents || 0), 0);
  const line_count = lines.length;

  return {
    subtotal_excl_cents,
    total_vat_cents,
    line_count
  };
}

export function getRoundingTolerance(): number {
  const envValue = process.env.INVOICE_ROUNDING_TOLERANCE_CENTS;
  const parsed = parseInt(envValue || '5', 10);
  return Math.max(0, isNaN(parsed) ? 5 : parsed);
}

export function validateInvoiceTotals(
  header: InvoiceHeader,
  computed: ComputedTotals,
  tolerance: number
): ValidationResult {
  const headerSubtotal = header.subtotal_excl_cents ?? 0;
  const headerVat = header.total_vat_cents ?? 0;
  const headerTotal = header.total_incl_cents ?? 0;
  const headerMeta = header.meta_rounding_diff_cents ?? 0;

  const expectedTotal = headerSubtotal + headerVat + headerMeta;

  const result: ValidationResult = {
    ok: true,
    expected: {
      subtotal_excl_cents: computed.subtotal_excl_cents,
      total_vat_cents: computed.total_vat_cents,
      total_incl_cents: expectedTotal
    },
    received: {
      subtotal_excl_cents: headerSubtotal,
      total_vat_cents: headerVat,
      total_incl_cents: headerTotal,
      meta_rounding_diff_cents: headerMeta
    },
    deltas: {
      subtotal_excl_cents: headerSubtotal - computed.subtotal_excl_cents,
      total_vat_cents: headerVat - computed.total_vat_cents,
      total_incl_cents: headerTotal - expectedTotal
    }
  };

  if (computed.line_count > 0) {
    // Check if required fields are defined
    if (header.subtotal_excl_cents == null || 
        header.total_vat_cents == null || 
        header.total_incl_cents == null) {
      result.ok = false;
      return result;
    }

    // Check tolerances
    if (Math.abs(result.deltas.subtotal_excl_cents) > tolerance ||
        Math.abs(result.deltas.total_vat_cents) > tolerance ||
        headerMeta < 0 ||
        headerTotal !== expectedTotal) {
      result.ok = false;
    }
  }

  return result;
}