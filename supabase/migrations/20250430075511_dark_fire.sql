/*
  # Mise en place du système d'organisations

  1. Nouvelles Tables
    - `organization`
      - `id` (uuid, primary key)
      - `name` (text, obligatoire)
      - `created_at` (timestamp)

  2. Modifications
    - Ajout de `organization_id` à `profiles`
    - Migration de `restaurant_id` vers `organization_id` dans `ingredient`

  3. Sécurité
    - RLS sur `organization`
    - Mise à jour des politiques sur `ingredient`
*/

-- Création de la table organization
CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Ajout de organization_id à profiles
ALTER TABLE profiles 
ADD COLUMN organization_id uuid REFERENCES organization(id) ON DELETE CASCADE;

-- Suppression des anciennes politiques sur ingredient
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les ingrédients de leurs restaur" ON ingredient;
DROP POLICY IF EXISTS "Les propriétaires peuvent gérer leurs ingrédients" ON ingredient;

-- Modification de la table ingredient
ALTER TABLE ingredient DROP CONSTRAINT ingredient_restaurant_id_fkey;
ALTER TABLE ingredient DROP COLUMN restaurant_id;
ALTER TABLE ingredient ADD COLUMN organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE;

-- Politiques RLS pour organization
CREATE POLICY "Les utilisateurs peuvent lire leur propre organisation"
  ON organization
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent gérer leur propre organisation"
  ON organization
  FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Nouvelles politiques RLS pour ingredient
CREATE POLICY "Les utilisateurs peuvent lire les ingrédients de leur organisation"
  ON ingredient
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent gérer les ingrédients de leur organisation"
  ON ingredient
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );