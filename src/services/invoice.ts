import { getSessionToken } from '../utils/auth';

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