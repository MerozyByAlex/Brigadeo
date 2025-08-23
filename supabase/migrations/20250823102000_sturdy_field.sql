/*
  # Enforce NOT NULL on invoice.created_at

  1. Update existing NULL values
  2. Add NOT NULL constraint
*/

-- Replace NULL created_at with current timestamp
UPDATE public.invoice
SET created_at = NOW()
WHERE created_at IS NULL;

-- Make created_at NOT NULL
ALTER TABLE public.invoice
ALTER COLUMN created_at SET NOT NULL;

