/*
  # Migration des abonnements Stripe vers les organisations

  1. Modifications
    - Ajout de organization_id dans stripe_subscriptions
    - Nouvelle vue stripe_organization_subscriptions
    - Mise à jour des politiques RLS
    - Migration des données existantes

  2. Sécurité
    - Politiques RLS basées sur l'organisation
*/

-- Ajout de organization_id à stripe_subscriptions
ALTER TABLE stripe_subscriptions 
ADD COLUMN organization_id uuid REFERENCES organization(id) ON DELETE CASCADE;

-- Migration des données existantes
DO $$ 
BEGIN
  UPDATE stripe_subscriptions ss
  SET organization_id = p.organization_id
  FROM stripe_customers sc
  JOIN profiles p ON sc.user_id = p.user_id
  WHERE ss.customer_id = sc.customer_id
  AND ss.organization_id IS NULL;
END $$;

-- Suppression de l'ancienne vue
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Création de la nouvelle vue basée sur les organisations
CREATE VIEW stripe_organization_subscriptions WITH (security_invoker = true) AS
SELECT
    s.organization_id,
    s.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_subscriptions s
WHERE s.organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
)
AND s.deleted_at IS NULL;

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their organization subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

GRANT SELECT ON stripe_organization_subscriptions TO authenticated;