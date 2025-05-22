/*
  # Tables de gestion des abonnements

  1. Nouvelles Tables
    - `organization_subscription` : Gestion des abonnements par organisation
    - `subscription_modules` : Catalogue des modules disponibles
    - `organization_modules` : Modules activés par organisation
    - `subscription_logs` : Journal des événements d'abonnement

  2. Relations
    - Liens avec la table `organization`
    - Liens entre les modules et les organisations

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture/écriture adaptées
*/

-- Table organization_subscription
CREATE TABLE IF NOT EXISTS organization_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text,
  is_active boolean NOT NULL DEFAULT false,
  granted_by_admin boolean NOT NULL DEFAULT false,
  manual_access_until date,
  access_status text NOT NULL CHECK (access_status IN ('manual', 'stripe', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table subscription_modules
CREATE TABLE IF NOT EXISTS subscription_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  monthly_price_cents integer NOT NULL CHECK (monthly_price_cents >= 0),
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table organization_modules
CREATE TABLE IF NOT EXISTS organization_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES subscription_modules(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  granted_by_admin boolean NOT NULL DEFAULT false,
  granted_until date,
  activated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, module_id)
);

-- Table subscription_logs
CREATE TABLE IF NOT EXISTS subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  stripe_event_id text,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE organization_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour organization_subscription
CREATE POLICY "Les utilisateurs peuvent lire leur abonnement"
  ON organization_subscription
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour subscription_modules
CREATE POLICY "Tout le monde peut lire les modules actifs"
  ON subscription_modules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Politiques RLS pour organization_modules
CREATE POLICY "Les utilisateurs peuvent lire leurs modules"
  ON organization_modules
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour subscription_logs
CREATE POLICY "Les utilisateurs peuvent lire leurs logs d'abonnement"
  ON subscription_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_subscription_updated_at
  BEFORE UPDATE ON organization_subscription
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();