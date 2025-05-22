import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Vérification de l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Récupération de l'organization_id de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      throw new Error('Organisation non trouvée');
    }

    // Récupération du customer_id Stripe
    const { data: subscription, error: subscriptionError } = await supabase
      .from('stripe_subscriptions')
      .select('customer_id')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single();

    if (subscriptionError || !subscription?.customer_id) {
      throw new Error('Abonnement non trouvé');
    }

    // Création de la session du portail client
    const { url } = await stripe.billingPortal.sessions.create({
      customer: subscription.customer_id,
      return_url: `${req.headers.get('origin')}/compte`,
    });

    return new Response(
      JSON.stringify({ url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});