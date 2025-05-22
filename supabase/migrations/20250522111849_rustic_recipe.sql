/*
  # Suppression des champs d'abonnement obsolètes

  1. Modifications
    - Suppression du champ `abonnement_plan` de la table `profiles`
    - Suppression du champ `abonnement_statut` de la table `profiles`

  2. Justification
    - Ces champs sont remplacés par le nouveau système d'abonnement basé sur les organisations
    - Les statuts d'abonnement sont maintenant gérés via les tables stripe_subscriptions et stripe_organization_subscriptions
*/

ALTER TABLE profiles 
DROP COLUMN IF EXISTS abonnement_plan,
DROP COLUMN IF EXISTS abonnement_statut;