/*
  # Ajout de la relation entre ingredient et ingredient_category

  1. Modifications
    - Ajout de `category_id` (uuid, nullable) avec clé étrangère vers `ingredient_category(id)`
    - Comportement ON DELETE SET NULL
    - Index sur category_id pour optimiser les requêtes

  2. Sécurité
    - Les politiques RLS existantes restent inchangées
*/

-- Ajout de la colonne category_id avec la clé étrangère
ALTER TABLE ingredient
ADD COLUMN category_id uuid REFERENCES ingredient_category(id) ON DELETE SET NULL;

-- Création de l'index
CREATE INDEX ingredient_category_id_idx ON ingredient(category_id);