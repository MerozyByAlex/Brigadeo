/*
  # Contraintes de non-négativité sur les montants de facture

  1. Sécurité des données
    - Vérifie l'absence de valeurs négatives existantes
    - Empêche l'enregistrement de montants négatifs dans:
      - subtotal_excl_cents
      - total_vat_cents
      - total_incl_cents
      - meta_rounding_diff_cents
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.invoice
    WHERE subtotal_excl_cents < 0
       OR total_vat_cents < 0
       OR total_incl_cents < 0
       OR meta_rounding_diff_cents < 0
  ) THEN
    RAISE EXCEPTION 'Invoices contain negative monetary values';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_subtotal_excl_cents_non_negative'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_subtotal_excl_cents_non_negative
    CHECK (subtotal_excl_cents >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_total_vat_cents_non_negative'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_total_vat_cents_non_negative
    CHECK (total_vat_cents >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_total_incl_cents_non_negative'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_total_incl_cents_non_negative
    CHECK (total_incl_cents >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_meta_rounding_diff_cents_non_negative'
  ) THEN
    ALTER TABLE public.invoice
    ADD CONSTRAINT invoice_meta_rounding_diff_cents_non_negative
    CHECK (meta_rounding_diff_cents >= 0);
  END IF;
END $$;
