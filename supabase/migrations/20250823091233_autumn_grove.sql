-- Step 1: suppliers (fournisseurs) + lien invoice propre (BDD vide, strict)

-- 1) Table supplier
CREATE TABLE IF NOT EXISTS public.supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  name text NOT NULL,
  siret text,
  vat_number text,
  natural_key text GENERATED ALWAYS AS (COALESCE(siret, vat_number, name)) STORED,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT supplier_org_natural_key_unique UNIQUE (organization_id, natural_key)
);

CREATE INDEX IF NOT EXISTS supplier_org_name_idx
  ON public.supplier (organization_id, name);

-- 2) RLS sur supplier (séparé par verbe)
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;

-- SELECT: membres de l'organisation
CREATE POLICY supplier_select_same_org
  ON public.supplier
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = uid()
    )
  );

-- INSERT: membres de l'organisation
CREATE POLICY supplier_insert_same_org
  ON public.supplier
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = uid()
    )
  );

-- UPDATE: membres de l'organisation
CREATE POLICY supplier_update_same_org
  ON public.supplier
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = uid()
    )
  );

-- DELETE: admins uniquement (dans la même organisation)
CREATE POLICY supplier_delete_admin_only
  ON public.supplier
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = uid() AND p.role = 'admin'
    )
  );

-- 3) Modif invoice: supprimer legacy et ajouter supplier_id NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoice' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE public.invoice DROP COLUMN supplier;
  END IF;
END $$;

-- Ajout du FK strict (NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoice' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public.invoice
      ADD COLUMN supplier_id uuid NOT NULL REFERENCES public.supplier(id) ON DELETE RESTRICT;
  ELSE
    -- Si la colonne existe déjà, on la renforce en NOT NULL
    ALTER TABLE public.invoice
      ALTER COLUMN supplier_id SET NOT NULL;
  END IF;
END $$;

-- 4) Index actuel (on le migrera vers invoice_date à l'étape 2)
CREATE INDEX IF NOT EXISTS invoice_org_date_idx
  ON public.invoice (organization_id, date);
