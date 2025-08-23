/*
  # Fix invoice_line table schema

  1. Column Updates
    - Change `unit_base_qty` from numeric to integer with NOT NULL constraint
    - Make `confidence` nullable while keeping validation constraints

  2. Constraint Updates
    - Add check constraint for `unit_base_qty` > 0
    - Update confidence constraint to allow NULL values

  3. Index Updates
    - Drop old ingredient_match_id index
    - Create new ingredient index with better naming
*/

-- Fix unit_base_qty column type and constraints
ALTER TABLE public.invoice_line
  DROP CONSTRAINT IF EXISTS invoice_line_unit_base_qty_check,
  ALTER COLUMN unit_base_qty TYPE int USING CEIL(unit_base_qty),
  ALTER COLUMN unit_base_qty SET NOT NULL,
  ADD CONSTRAINT invoice_line_unit_base_qty_check CHECK (unit_base_qty > 0);

-- Fix confidence column to allow NULL values
ALTER TABLE public.invoice_line
  DROP CONSTRAINT IF EXISTS invoice_line_confidence_check,
  ALTER COLUMN confidence DROP NOT NULL,
  ADD CONSTRAINT invoice_line_confidence_check
    CHECK (confidence BETWEEN 0 AND 1 OR confidence IS NULL);

-- Update indexes
DROP INDEX IF EXISTS public.invoice_line_ingredient_match_id_idx;
CREATE INDEX IF NOT EXISTS invoice_line_ingredient_idx
  ON public.invoice_line (ingredient_match_id);
