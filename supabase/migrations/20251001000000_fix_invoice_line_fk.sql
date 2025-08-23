-- Supprime la contrainte erronée si elle existe
ALTER TABLE public.invoice_line
  DROP CONSTRAINT IF EXISTS invoice_line_ingredient_match_id_fkey;

-- Ajoute la contrainte correcte vers public.ingredient
ALTER TABLE public.invoice_line
  ADD CONSTRAINT invoice_line_ingredient_id_fkey
  FOREIGN KEY (ingredient_match_id) REFERENCES public.ingredient(id);
