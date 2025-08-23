/*
  # Enrichissement de la table invoice

  1. Modifications de colonnes
    - Renommage de `date` en `invoice_date`
    
  2. Nouvelles colonnes
    - `invoice_number` (text, nullable) - Numéro de facture (ex: "F12345")
    - `currency` (text, NOT NULL, default 'EUR') - Devise de la facture
    - `subtotal_excl_cents` (integer, nullable) - Sous-total HT en centimes
    - `total_vat_cents` (integer, nullable) - Total TVA en centimes
    - `total_incl_cents` (integer, nullable) - Total TTC en centimes
    - `payment_method` (text, nullable) - Méthode de paiement avec contrainte
    - `status` (text, NOT NULL, default 'imported') - Statut de la facture
    - `source_hash` (text, nullable, unique) - Hash SHA-256 du fichier source
    - `parser_version` (text, nullable) - Version du parser utilisé
    - `ocr_confidence` (numeric, nullable) - Niveau de confiance OCR
    - `meta_rounding_diff_cents` (integer, nullable) - Différence d'arrondi
    - `notes` (text, nullable) - Notes libres

  3. Contraintes
    - Contrainte d'unicité sur (organization_id, source_hash)
    - Contrainte CHECK sur payment_method
    - Contrainte CHECK sur status

  4. Index
    - Suppression de l'ancien index sur (organization_id, date)
    - Création d'un nouvel index sur (organization_id, invoice_date)
*/

-- Renommer la colonne date en invoice_date
ALTER TABLE public.invoice RENAME COLUMN date TO invoice_date;

-- Supprimer l'ancien index sur (organization_id, date)
DROP INDEX IF EXISTS public.invoice_org_date_idx;

-- Ajouter les nouvelles colonnes
ALTER TABLE public.invoice 
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS subtotal_excl_cents integer,
ADD COLUMN IF NOT EXISTS total_vat_cents integer,
ADD COLUMN IF NOT EXISTS total_incl_cents integer,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'imported',
ADD COLUMN IF NOT EXISTS source_hash text,
ADD COLUMN IF NOT EXISTS parser_version text,
ADD COLUMN IF NOT EXISTS ocr_confidence numeric,
ADD COLUMN IF NOT EXISTS meta_rounding_diff_cents integer,
ADD COLUMN IF NOT EXISTS notes text;

-- Ajouter les contraintes CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'invoice_payment_method_check'
  ) THEN
    ALTER TABLE public.invoice 
    ADD CONSTRAINT invoice_payment_method_check 
    CHECK (payment_method IN ('card','wire','cash','other'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'invoice_status_check'
  ) THEN
    ALTER TABLE public.invoice 
    ADD CONSTRAINT invoice_status_check 
    CHECK (status IN ('imported','validated','error'));
  END IF;
END $$;

-- Ajouter la contrainte d'unicité sur (organization_id, source_hash)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoice_org_source_hash_unique'
  ) THEN
    ALTER TABLE public.invoice 
    ADD CONSTRAINT invoice_org_source_hash_unique 
    UNIQUE (organization_id, source_hash);
  END IF;
END $$;

-- Créer le nouvel index sur (organization_id, invoice_date)
CREATE INDEX IF NOT EXISTS invoice_org_invoice_date_idx 
ON public.invoice USING btree (organization_id, invoice_date);