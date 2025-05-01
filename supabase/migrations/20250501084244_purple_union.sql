/*
  # Ajout des colonnes pour la gestion des lignes de facture

  1. Modifications
    - Ajout de `invoice_id` (uuid, nullable) avec clé étrangère vers `invoice(id)`
    - Ajout de `raw_label` (text, nullable) pour le libellé brut de la facture

  2. Relations
    - Lien avec la table `invoice`
    - Suppression en cascade si la facture est supprimée

  3. Sécurité
    - Les politiques RLS existantes restent inchangées
*/

-- Ajout des nouvelles colonnes
ALTER TABLE product
ADD COLUMN invoice_id uuid REFERENCES invoice(id) ON DELETE CASCADE,
ADD COLUMN raw_label text;