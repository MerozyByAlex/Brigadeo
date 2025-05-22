import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

// Vérification des variables d'environnement requises
if (!SUPABASE_URL) {
  throw new Error(
    'La variable d\'environnement SUPABASE_URL est manquante.\n' +
    'Assurez-vous qu\'elle est correctement définie dans le fichier .env'
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'La variable d\'environnement SUPABASE_SERVICE_ROLE_KEY est manquante.\n' +
    'Assurez-vous qu\'elle est correctement définie dans le fichier .env'
  );
}

// Création du client Supabase avec les variables validées
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Log de confirmation (utile pour le debugging)
console.log(
  '[DEBUG] Client Supabase initialisé avec succès\n' +
  `URL: ${SUPABASE_URL}\n` +
  `Clé: ${SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}...`
);