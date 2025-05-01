import { supabase } from '../lib/supabase';

export async function getCurrentUser() {
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