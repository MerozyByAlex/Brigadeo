/*
  # Ajout de la table ingredient_category

  1. Nouvelle Table
    - `ingredient_category`
      - `id` (uuid, clé primaire)
      - `name` (text, obligatoire)
      - `organization_id` (uuid, nullable, référence organization.id)
      - `created_at` (timestamp)

  2. Index
    - Index sur organization_id pour optimiser les requêtes

  3. Sécurité
    - Active RLS
    - Politique de lecture pour les catégories globales et celles de l'organisation
    - Politique d'écriture uniquement pour les catégories de son organisation
*/

CREATE TABLE IF NOT EXISTS ingredient_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_id uuid REFERENCES organization(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ingredient_category_organization_id_idx ON ingredient_category(organization_id);

ALTER TABLE ingredient_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent lire les catégories globales et celles de leur organisation"
  ON ingredient_category
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent gérer les catégories de leur organisation"
  ON ingredient_category
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