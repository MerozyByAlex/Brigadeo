/*
  # Création de la table ingredient

  1. Nouvelle Table
    - `ingredient`
      - `id` (uuid, clé primaire)
      - `name` (text, obligatoire)
      - `unit` (text, obligatoire)
      - `restaurant_id` (uuid, clé étrangère)
      - `created_at` (timestamp)

  2. Relations
    - Lien avec la table `restaurant`
    - Suppression en cascade

  3. Sécurité
    - Activation RLS
    - Politique de lecture pour les propriétaires
    - Politique d'écriture pour les propriétaires
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS ingredient (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE ingredient ENABLE ROW LEVEL SECURITY;

-- Politique de lecture
CREATE POLICY "Les utilisateurs peuvent lire les ingrédients de leurs restaurants"
  ON ingredient
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      INNER JOIN profiles p ON r.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Politique d'écriture
CREATE POLICY "Les propriétaires peuvent gérer leurs ingrédients"
  ON ingredient
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      INNER JOIN profiles p ON r.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT r.id
      FROM restaurant r
      INNER JOIN profiles p ON r.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );