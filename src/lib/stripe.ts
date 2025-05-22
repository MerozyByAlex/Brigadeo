import { supabase } from './supabase';

export async function createPortalSession(organizationId: string): Promise<string> {
  const { VITE_SUPABASE_URL } = import.meta.env;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization_id: organizationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la création de la session');
  }

  const { url } = await response.json();
  return url;
}