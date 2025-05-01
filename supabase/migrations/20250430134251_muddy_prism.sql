/*
  # Ajout du champ portions à la table recipes

  1. Modifications
    - Ajout du champ `portions` (integer)
      - NOT NULL
      - DEFAULT 1
      - CHECK (portions >= 1)

  2. Sécurité
    - Les politiques RLS existantes restent inchangées
*/

ALTER TABLE recipes
ADD COLUMN portions integer NOT NULL DEFAULT 1
CHECK (portions >= 1);