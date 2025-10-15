import { getSessionToken } from '../utils/auth';
import { supabase } from '../lib/supabase';
import { InvoiceHeaderPayload, InvoiceLinePayload } from 'shared/zod/invoice';
import type { InvoiceLine, InvoiceHeaderWithRelations } from '../types/invoice';

export async function getInvoiceById(id: string): Promise<InvoiceHeaderWithRelations> {
  const { data, error } = await supabase
    .from('invoice')
    .select(`
      id,
      invoice_number,
      invoice_date,
      status,
      currency,
      subtotal_excl_cents,
      total_vat_cents,
      total_incl_cents,
      meta_rounding_diff_cents,
      supplier:supplier_id (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Facture non trouvée');

  const rawHeader = {
    ...data,
    currency: data.currency,
    supplier: Array.isArray(data.supplier) ? data.supplier[0] : data.supplier
  };

  try {
    // Validation avec le schéma Zod
    const validatedHeader = InvoiceHeaderPayload.parse({
      ...rawHeader,
      invoice_date: new Date(rawHeader.invoice_date)
    });
    
    return {
      ...validatedHeader,
      supplier: rawHeader.supplier
    } as InvoiceHeaderWithRelations;
  } catch (parseError) {
    console.error('Erreur de validation des données de facture:', parseError);
    throw new Error('Données de facture invalides');
  }
}

export async function getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  try {
    const { data, error } = await supabase
      .from('invoice_line')
      .select('id, quantity, unit_label, unit_type, unit_base_qty, unit_price_excl_cents, line_total_excl_cents, vat_amount_cents, vat_rate, description')
      .eq('invoice_id', invoiceId)
      .order('id');

    if (error) throw error;
    
    const rawLines = data || [];
    
    try {
      // Validation avec le schéma Zod
      const validatedLines = rawLines.map(line => 
        InvoiceLinePayload.parse(line)
      );
      
      return validatedLines;
    } catch (parseError) {
      console.error('Erreur de validation des lignes de facture:', parseError);
      return []; // Retourner un tableau vide plutôt que de propager des données invalides
    }
  } catch (error: any) {
    if (
      error?.code === '42703'
    ) {
      return [];
    }
    throw error;
  }
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