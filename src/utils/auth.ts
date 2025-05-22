import { supabase } from '../lib/supabase';

export async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    throw new Error('Erreur lors de la récupération de la session');
  }
  
  if (!session) {
    throw new Error('Session absente ou expirée');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Utilisateur non connecté');
  }
  
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error || !profile) {
    throw new Error('Profil non trouvé');
  }
  
  return profile;
}

export async function getSessionToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('Erreur lors de la récupération de la session');
  }
  
  if (!session?.access_token) {
    throw new Error('Token de session non disponible');
  }
  
  return session.access_token;
}