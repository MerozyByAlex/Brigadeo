import { getSessionToken } from '../utils/auth';
import { supabase } from '../lib/supabase';

export type InvoiceHeader = {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  status: string;
  subtotal_excl_cents: number | null;
  total_vat_cents: number | null;
  total_incl_cents: number | null;
  meta_rounding_diff_cents: number | null;
  supplier: {
    name: string;
  } | null;
};

export type InvoiceLine = {
  id: string;
  quantity: number;
  unit: string;
  unit_price_excl_cents: number;
  total_excl_cents: number;
  total_vat_cents: number;
};

export async function getInvoiceById(id: string): Promise<InvoiceHeader> {
  const { data, error } = await supabase
    .from('invoice')
    .select(`
      id,
      invoice_number,
      invoice_date,
      status,
      subtotal_excl_cents,
      total_vat_cents,
      total_incl_cents,
      meta_rounding_diff_cents,
      supplier:supplier_id (
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Facture non trouvée');

  return {
    ...data,
    supplier: Array.isArray(data.supplier) ? data.supplier[0] : data.supplier
  };
}

export async function getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  const { data, error } = await supabase
    .from('invoice_line')
    .select('id, quantity, unit, unit_price_excl_cents, total_excl_cents, total_vat_cents')
    .eq('invoice_id', invoiceId)
    .order('id');

  if (error) throw error;
  return data || [];
}

export async function analyzeInvoice(storagePath: string, organization_id: string): Promise<any[]> {
  try {
    const { VITE_EDGE_FUNCTION_URL } = import.meta.env;
    const token = await getSessionToken();
    
    const response = await fetch(`${VITE_EDGE_FUNCTION_URL}/analyze-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ storagePath, organization_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze invoice');
    }
    
    // Parse la réponse JSON
    const data = await response.json();
    
    // Récupération du champ analysis
    const { analysis } = data;
    if (!analysis) {
      throw new Error('Réponse invalide : champ analysis manquant');
    }

    // Nettoyage des blocs Markdown éventuels
    const cleanedAnalysis = analysis.replace(/```json\n?|\n?```/g, '').trim();

    // Parse du JSON
    try {
      return JSON.parse(cleanedAnalysis);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.debug('Contenu à parser:', cleanedAnalysis);
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la facture:', error);
    throw error;
  }
}