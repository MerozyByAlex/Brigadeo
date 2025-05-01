/*
  # Modification du champ date de la table product

  1. Modifications
    - Changement du type du champ `date` de `date` vers `timestamptz`
    - Ajout d'une valeur par défaut `now()`

  2. Sécurité
    - Les politiques RLS existantes restent inchangées
*/

ALTER TABLE product 
ALTER COLUMN date TYPE timestamptz USING date::timestamptz,
ALTER COLUMN date SET DEFAULT now();