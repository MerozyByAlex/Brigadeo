/*
  # Ajout du champ storage_path à la table invoice

  1. Modifications
    - Ajout du champ `storage_path` (text, obligatoire)
    - Modification de `file_url` pour le rendre optionnel
      (il sera généré dynamiquement)

  2. Sécurité
    - Les politiques RLS existantes restent inchangées
*/

-- Ajout de la colonne storage_path
ALTER TABLE invoice
ADD COLUMN storage_path text NOT NULL;

-- Modification de file_url pour le rendre optionnel
ALTER TABLE invoice
ALTER COLUMN file_url DROP NOT NULL;