import { postToBackend } from './backend';

export async function analyzeInvoice(storagePath: string, organization_id: string): Promise<any[]> {
  try {
    const response = await postToBackend('/analyze-invoice', { storagePath, organization_id });
    
    // Récupération du champ analysis
    const { analysis } = response;
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