/*
  # Consolidate supplier and invoice migrations

  1. Schema Consolidation
    - Ensure single `supplier` table exists with proper structure
    - Ensure single `supplier_id` foreign key on `invoice` table
    - Remove any duplicate policies or indexes if they exist
    - Maintain data integrity throughout consolidation

  2. Supplier Table Structure
    - `id` (uuid, primary key)
    - `organization_id` (uuid, not null, FK to organization)
    - `name` (text, not null)
    - `siret` (text, nullable)
    - `vat_number` (text, nullable)
    - `natural_key` (text, generated, unique per organization)
    - `created_at` (timestamptz, default now())

  3. Invoice Table Updates
    - Ensure `supplier_id` column exists as FK to supplier
    - Remove any legacy supplier-related columns if they exist

  4. Security & Constraints
    - Maintain existing RLS policies
    - Ensure proper indexes for performance
    - Preserve unique constraints on natural_key per organization
*/

-- Ensure supplier table exists with correct structure
CREATE TABLE IF NOT EXISTS supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  siret text,
  vat_number text,
  natural_key text GENERATED ALWAYS AS (COALESCE(siret, vat_number, name)) STORED,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'supplier_organization_id_fkey'
    AND table_name = 'supplier'
  ) THEN
    ALTER TABLE supplier ADD CONSTRAINT supplier_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure unique constraint on organization_id + natural_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'supplier_org_natural_key_unique'
    AND table_name = 'supplier'
  ) THEN
    CREATE UNIQUE INDEX supplier_org_natural_key_unique 
    ON supplier (organization_id, natural_key);
  END IF;
END $$;

-- Ensure performance index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'supplier_org_name_idx'
    AND tablename = 'supplier'
  ) THEN
    CREATE INDEX supplier_org_name_idx ON supplier (organization_id, name);
  END IF;
END $$;

-- Ensure supplier_id column exists on invoice table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE invoice ADD COLUMN supplier_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for supplier_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoice_supplier_id_fkey'
    AND table_name = 'invoice'
  ) THEN
    ALTER TABLE invoice ADD CONSTRAINT invoice_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Enable RLS on supplier table
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;

-- Drop duplicate policies if they exist, then create the correct ones
DROP POLICY IF EXISTS "Users can manage suppliers in their organization" ON supplier;
DROP POLICY IF EXISTS "Users can read suppliers in their organization" ON supplier;
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer les fournisseurs de leur organisation" ON supplier;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les fournisseurs de leur organisation" ON supplier;

-- Create supplier RLS policies
CREATE POLICY "Users can manage suppliers in their organization"
  ON supplier
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can read suppliers in their organization"
  ON supplier
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));