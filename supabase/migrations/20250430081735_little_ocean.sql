/*
  # Simplification du champ unit de la table ingredient

  1. Modifications
    - Suppression du champ unit existant
    - Création d'un nouveau champ unit avec valeurs simplifiées
      - 'weight' : mesure en grammes
      - 'volume' : mesure en millilitres
      - 'unit' : comptage par pièce

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Modification de la table ingredient
ALTER TABLE ingredient DROP COLUMN IF EXISTS unit;
ALTER TABLE ingredient ADD COLUMN unit text NOT NULL;