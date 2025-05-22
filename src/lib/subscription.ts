import { supabase } from './supabase';

type SubscriptionData = {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
};

export async function getSubscriptionByOrganization(organizationId: string): Promise<SubscriptionData | null> {
  const { data, error } = await supabase
    .from('stripe_organization_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return null;
  }

  return data;
}