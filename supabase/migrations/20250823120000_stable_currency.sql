/*
  # Enforce currency format for invoice

  - Normalize existing currency values to three-letter uppercase codes.
  - Change column type to char(3).
  - Add CHECK constraint to ensure three uppercase letters.
*/

-- Normalize existing currency values
UPDATE public.invoice
SET currency = upper(substr(currency, 1, 3));

-- Change column type to char(3)
ALTER TABLE public.invoice
ALTER COLUMN currency TYPE char(3)
USING currency;

-- Add CHECK constraint for three uppercase letters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_currency_format_check'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_currency_format_check
    CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
END $$;
