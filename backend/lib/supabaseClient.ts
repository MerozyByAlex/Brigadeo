import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises');
}

console.log('[DEBUG] Supabase client init avec clé :', SUPABASE_SERVICE_ROLE_KEY.slice(0, 10));

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
