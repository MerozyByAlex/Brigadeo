/*
  # Ajout des tables recipes et recipe_ingredients

  1. Nouvelles Tables
    - `recipes`
      - `id` (uuid, clé primaire)
      - `name` (text, obligatoire)
      - `description` (text, facultatif)
      - `restaurant_id` (uuid, clé étrangère vers restaurants)
      - `created_at` (timestamp)
    
    - `recipe_ingredients`
      - `id` (uuid, clé primaire)
      - `recipe_id` (uuid, clé étrangère vers recipes)
      - `ingredient_id` (uuid, clé étrangère vers ingredients)
      - `quantity` (numeric, obligatoire)
      - `created_at` (timestamp)

  2. Relations
    - Lien entre recipes et restaurants
    - Lien entre recipe_ingredients et recipes
    - Lien entre recipe_ingredients et ingredients
    - Suppression en cascade pour toutes les relations

  3. Sécurité
    - Active RLS sur les deux tables
    - Politiques de lecture/écriture basées sur l'organisation
*/

-- Création de la table recipes
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  restaurant_id uuid NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS pour recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Politiques pour recipes
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les recettes de leur organisation" ON recipes;
CREATE POLICY "Les utilisateurs peuvent lire les recettes de leur organisation"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      WHERE r.organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer les recettes de leur organisation" ON recipes;
CREATE POLICY "Les utilisateurs peuvent gérer les recettes de leur organisation"
  ON recipes
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      WHERE r.organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      WHERE r.organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Création de la table recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS pour recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Politiques pour recipe_ingredients
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les ingrédients des recettes de leur organisation" ON recipe_ingredients;
CREATE POLICY "Les utilisateurs peuvent lire les ingrédients des recettes de leur organisation"
  ON recipe_ingredients
  FOR SELECT
  TO authenticated
  USING (
    recipe_id IN (
      SELECT r.id
      FROM recipes r
      WHERE r.restaurant_id IN (
        SELECT rest.id
        FROM restaurant rest
        WHERE rest.organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer les ingrédients des recettes de leur organisation" ON recipe_ingredients;
CREATE POLICY "Les utilisateurs peuvent gérer les ingrédients des recettes de leur organisation"
  ON recipe_ingredients
  FOR ALL
  TO authenticated
  USING (
    recipe_id IN (
      SELECT r.id
      FROM recipes r
      WHERE r.restaurant_id IN (
        SELECT rest.id
        FROM restaurant rest
        WHERE rest.organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    recipe_id IN (
      SELECT r.id
      FROM recipes r
      WHERE r.restaurant_id IN (
        SELECT rest.id
        FROM restaurant rest
        WHERE rest.organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE user_id = auth.uid()
        )
      )
    )
  );