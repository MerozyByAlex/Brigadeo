/*
  # Création de la table restaurant

  1. Nouvelle Table
    - `restaurant`
      - `id` (uuid, clé primaire)
      - `name` (text, non null)
      - `owner_id` (uuid, clé étrangère vers profiles.id)
      - `created_at` (timestamp)

  2. Relations
    - Clé étrangère entre restaurant.owner_id et profiles.id
    - Suppression en cascade si le profil est supprimé

  3. Sécurité
    - Active RLS sur la table restaurant
    - Ajoute une politique pour la lecture des restaurants
    - Ajoute une politique pour la modification de ses propres restaurants
*/

CREATE TABLE IF NOT EXISTS restaurant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire tous les restaurants
CREATE POLICY "Les utilisateurs peuvent lire tous les restaurants"
  ON restaurant
  FOR SELECT
  TO authenticated
  USING (true);

-- Les utilisateurs peuvent uniquement modifier leurs propres restaurants
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres restaurants"
  ON restaurant
  FOR ALL
  TO authenticated
  USING (owner_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (owner_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));