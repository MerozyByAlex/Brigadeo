/**
 * Ensure ocr_confidence values are within [0,1] and add a CHECK constraint.
 * Any value outside this range is set to NULL before applying the constraint.
 */

-- Invalidate out-of-range ocr_confidence values
UPDATE public.invoice
SET ocr_confidence = NULL
WHERE ocr_confidence IS NOT NULL
  AND (ocr_confidence < 0 OR ocr_confidence > 1);

-- Add CHECK constraint to enforce ocr_confidence between 0 and 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_ocr_confidence_check'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_ocr_confidence_check
    CHECK (ocr_confidence BETWEEN 0 AND 1);
  END IF;
END $$;
