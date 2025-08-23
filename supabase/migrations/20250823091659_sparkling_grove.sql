/*
  # Create supplier table and update invoice schema

  1. New Tables
    - `supplier`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organization)
      - `name` (text, required)
      - `siret` (text, optional)
      - `vat_number` (text, optional)
      - `natural_key` (text, generated column)
      - `created_at` (timestamptz)

  2. Table Modifications
    - `invoice`
      - Remove `supplier` text column if exists
      - Add `supplier_id` uuid column with foreign key to supplier

  3. Indexes
    - Unique constraint on (organization_id, natural_key) for supplier
    - Index on (organization_id, name) for supplier
    - Index on (organization_id, date) for invoice

  4. Security
    - Enable RLS on `supplier` table
    - Add policies for authenticated users to manage suppliers in their organization
*/

-- Create supplier table
CREATE TABLE IF NOT EXISTS public.supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  name text NOT NULL,
  siret text NULL,
  vat_number text NULL,
  natural_key text GENERATED ALWAYS AS (COALESCE(siret, vat_number, name)) STORED,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT supplier_org_natural_key_unique UNIQUE (organization_id, natural_key)
);

-- Create indexes for supplier table
CREATE INDEX IF NOT EXISTS supplier_org_name_idx ON public.supplier (organization_id, name);

-- Enable RLS on supplier table
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier table
DROP POLICY IF EXISTS "Users can manage suppliers in their organization" ON public.supplier;
CREATE POLICY "Users can manage suppliers in their organization"
  ON public.supplier
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

DROP POLICY IF EXISTS "Users can read suppliers in their organization" ON public.supplier;
CREATE POLICY "Users can read suppliers in their organization"
  ON public.supplier
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));

-- Modify invoice table
DO $$
BEGIN
  -- Drop supplier column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE public.invoice DROP COLUMN supplier;
  END IF;

  -- Add supplier_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public.invoice ADD COLUMN supplier_id uuid REFERENCES public.supplier(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Create index on invoice for organization and date
CREATE INDEX IF NOT EXISTS invoice_org_date_idx ON public.invoice (organization_id, date);