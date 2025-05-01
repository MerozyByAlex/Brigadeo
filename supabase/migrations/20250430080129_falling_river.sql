/*
  # Migration : passage des restaurants à organization_id

  1. Suppression du champ owner_id
  2. Ajout de organization_id
  3. Activation RLS
  4. Nouvelles politiques sécurisées
*/

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire tous les restaurants" ON restaurant;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres restaurants" ON restaurant;

-- Activer RLS sur la table restaurant
ALTER TABLE restaurant ENABLE ROW LEVEL SECURITY;

-- Modifier la table : supprimer owner_id et ajouter organization_id
ALTER TABLE restaurant DROP COLUMN IF EXISTS owner_id CASCADE;

ALTER TABLE restaurant
ADD COLUMN organization_id uuid NOT NULL
REFERENCES organization(id) ON DELETE CASCADE;

-- Nouvelle politique : lecture des restaurants de l'organisation
CREATE POLICY "Les utilisateurs peuvent lire les restaurants de leur organisation"
  ON restaurant
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Nouvelle politique : gestion des restaurants de l'organisation
CREATE POLICY "Les utilisateurs peuvent gérer les restaurants de leur organisation"
  ON restaurant
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
