/*
  # Create invoice_line table

  1. New Tables
    - `invoice_line`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoice)
      - `description` (text, required)
      - `quantity` (numeric, > 0)
      - `unit_label` (text, required)
      - `unit_type` (text, weight/volume/unit)
      - `unit_base_qty` (numeric, > 0)
      - `unit_price_excl_cents` (integer, >= 0)
      - `line_total_excl_cents` (integer, >= 0)
      - `vat_rate` (numeric, >= 0)
      - `vat_amount_cents` (integer, >= 0)
      - `category_hint` (text, optional)
      - `ingredient_match_id` (uuid, foreign key to ingredient_match)
      - `confidence` (numeric, 0-1)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `invoice_line` table
    - Add policy for users to read lines of their organization's invoices

  3. Indexes
    - Index on invoice_id for efficient lookups
    - Index on ingredient_match_id for matching queries
*/

CREATE TABLE IF NOT EXISTS public.invoice_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_label text NOT NULL,
  unit_type text NOT NULL CHECK (unit_type IN ('weight','volume','unit')),
  unit_base_qty numeric NOT NULL CHECK (unit_base_qty > 0),
  unit_price_excl_cents integer NOT NULL CHECK (unit_price_excl_cents >= 0),
  line_total_excl_cents integer NOT NULL CHECK (line_total_excl_cents >= 0),
  vat_rate numeric NOT NULL CHECK (vat_rate >= 0),
  vat_amount_cents integer NOT NULL CHECK (vat_amount_cents >= 0),
  category_hint text,
  ingredient_match_id uuid REFERENCES public.ingredient_match(id),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_line_invoice_id_idx ON public.invoice_line(invoice_id);
CREATE INDEX IF NOT EXISTS invoice_line_ingredient_match_id_idx ON public.invoice_line(ingredient_match_id);

ALTER TABLE public.invoice_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read invoice lines of their organization"
  ON public.invoice_line
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id
      FROM public.invoice i
      WHERE i.organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.user_id = auth.uid()
      )
    )
  );