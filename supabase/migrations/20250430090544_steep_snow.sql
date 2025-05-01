/*
  # Création de la table product

  1. Nouvelle Table
    - `product`
      - `id` (uuid, clé primaire)
      - `ingredient_id` (uuid, FK vers ingredient)
      - `organization_id` (uuid, FK vers organization)
      - `label` (text, facultatif)
      - `quantity` (numeric, non nul)
      - `price_cents` (integer, non nul)
      - `date` (date, non nul)
      - `created_at` (timestamp)

  2. Relations
    - Clé étrangère vers `ingredient`
    - Clé étrangère vers `organization`
    - Suppression en cascade

  3. Sécurité
    - Active RLS
    - Politiques pour lecture/écriture par organisation
*/

CREATE TABLE IF NOT EXISTS product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  label text,
  quantity numeric NOT NULL,
  price_cents integer NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- Politique de lecture
CREATE POLICY "Les utilisateurs peuvent lire les produits de leur organisation"
  ON product
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Politique d'écriture
CREATE POLICY "Les utilisateurs peuvent gérer les produits de leur organisation"
  ON product
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