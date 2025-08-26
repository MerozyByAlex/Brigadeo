/*
  # Create product_price_history table

  1. New Table
    - `product_price_history` table for tracking price changes over time
    - Supports both invoice_line and manual price entries
    - Stores normalized price data with proper units and quantities

  2. Table Structure
    - `id` (uuid, primary key)
    - `organization_id` (uuid, not null, FK to organization)
    - `restaurant_id` (uuid, nullable, FK to restaurant)
    - `product_id` (uuid, nullable, FK to product)
    - `source_type` (text, check constraint: 'invoice_line' or 'manual')
    - `source_id` (uuid, nullable, references source record)
    - `currency` (char(3), not null, ISO currency code)
    - `price_excl_cents` (integer, not null, >= 0)
    - `quantity` (numeric, not null, > 0)
    - `unit_type` (text, check constraint: 'weight', 'volume', or 'unit')
    - `unit_base_qty` (numeric, not null, > 0)
    - `recorded_at` (timestamptz, not null, default now())

  3. Indexes
    - Primary performance index on (product_id, recorded_at DESC)
    - Organization-wide index on (organization_id, recorded_at DESC)

  4. Security
    - Enable RLS with organization-based access control
    - Full CRUD policies using existing organization membership pattern
*/

-- Create product_price_history table
CREATE TABLE IF NOT EXISTS product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  restaurant_id uuid,
  product_id uuid,
  source_type text NOT NULL CHECK (source_type IN ('invoice_line', 'manual')),
  source_id uuid,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  price_excl_cents integer NOT NULL CHECK (price_excl_cents >= 0),
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_type text NOT NULL CHECK (unit_type IN ('weight', 'volume', 'unit')),
  unit_base_qty numeric NOT NULL CHECK (unit_base_qty > 0),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_price_history_organization_id_fkey'
    AND table_name = 'product_price_history'
  ) THEN
    ALTER TABLE product_price_history ADD CONSTRAINT product_price_history_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_price_history_restaurant_id_fkey'
    AND table_name = 'product_price_history'
  ) THEN
    ALTER TABLE product_price_history ADD CONSTRAINT product_price_history_restaurant_id_fkey 
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_price_history_product_id_fkey'
    AND table_name = 'product_price_history'
  ) THEN
    ALTER TABLE product_price_history ADD CONSTRAINT product_price_history_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create performance indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'product_price_history_product_recorded_idx'
    AND tablename = 'product_price_history'
  ) THEN
    CREATE INDEX product_price_history_product_recorded_idx 
    ON product_price_history (product_id, recorded_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'product_price_history_org_recorded_idx'
    AND tablename = 'product_price_history'
  ) THEN
    CREATE INDEX product_price_history_org_recorded_idx 
    ON product_price_history (organization_id, recorded_at DESC);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using existing organization membership pattern
CREATE POLICY "Users can read price history for their organization"
  ON product_price_history
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert price history for their organization"
  ON product_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update price history for their organization"
  ON product_price_history
  FOR UPDATE
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

CREATE POLICY "Users can delete price history for their organization"
  ON product_price_history
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ));