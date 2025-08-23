/*
  # Create supplier table and update invoice schema

  1. New Tables
    - `supplier`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organization)
      - `name` (text, required)
      - `siret` (text, optional)
      - `vat_number` (text, optional)
      - `natural_key` (text, generated column for uniqueness)
      - `created_at` (timestamptz, default now)
      - Unique constraint on (organization_id, natural_key)
      - Index on (organization_id, name)

  2. Table Modifications
    - `invoice`
      - Remove `supplier` text column if it exists
      - Add `supplier_id` uuid column with foreign key to supplier table

  3. Indexes
    - Add index on invoice (organization_id, date) for performance

  4. Security
    - Enable RLS on `supplier` table
    - Add policies for authenticated users to manage suppliers in their organization
*/

-- Create supplier table
CREATE TABLE IF NOT EXISTS supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL,
  siret text NULL,
  vat_number text NULL,
  natural_key text GENERATED ALWAYS AS (COALESCE(siret, vat_number, name)) STORED,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT supplier_org_natural_key_unique UNIQUE (organization_id, natural_key)
);

-- Create index on supplier
CREATE INDEX IF NOT EXISTS supplier_org_name_idx ON supplier (organization_id, name);

-- Enable RLS on supplier table
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier table
CREATE POLICY "Users can manage suppliers in their organization"
  ON supplier
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = uid()
  ));

CREATE POLICY "Users can read suppliers in their organization"
  ON supplier
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = uid()
  ));

-- Modify invoice table: remove supplier text column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE invoice DROP COLUMN supplier;
  END IF;
END $$;

-- Add supplier_id column to invoice table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE invoice ADD COLUMN supplier_id uuid REFERENCES supplier(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Create useful index on invoice
CREATE INDEX IF NOT EXISTS invoice_org_date_idx ON invoice (organization_id, date);
