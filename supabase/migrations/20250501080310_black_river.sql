/*
  # Création de la table invoice et du bucket de stockage

  1. Nouvelle Table
    - `invoice`
      - `id` (uuid, clé primaire)
      - `organization_id` (uuid, FK vers organization)
      - `restaurant_id` (uuid, FK vers restaurant)
      - `file_url` (text, URL du fichier PDF)
      - `date` (timestamptz, date de la facture)
      - `supplier` (text, optionnel)
      - `created_at` (timestamptz)

  2. Relations
    - Clé étrangère vers `organization`
    - Clé étrangère vers `restaurant`
    - Suppression en cascade

  3. Sécurité
    - Active RLS
    - Politiques pour lecture/écriture par organisation
*/

-- Création du bucket de stockage pour les factures
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- Création de la table invoice
CREATE TABLE IF NOT EXISTS invoice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  date timestamptz NOT NULL,
  supplier text,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

-- Politique de lecture
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les factures de leur organisation" ON invoice;
CREATE POLICY "Les utilisateurs peuvent lire les factures de leur organisation"
  ON invoice
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
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer les factures de leur organisation" ON invoice;
CREATE POLICY "Les utilisateurs peuvent gérer les factures de leur organisation"
  ON invoice
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

-- Politiques de stockage pour le bucket invoices
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leurs factures" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent lire leurs factures"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leurs factures" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent uploader leurs factures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs factures" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent supprimer leurs factures"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );