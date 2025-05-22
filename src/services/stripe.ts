import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  const { VITE_EDGE_FUNCTION_URL } = import.meta.env;
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Non authentifié');
  }

  const endpoint = `${VITE_EDGE_FUNCTION_URL}/stripe-checkout`;

  console.log('📨 Appel à Stripe Checkout :', {
    endpoint,
    price_id: priceId,
    mode,
    token: session.access_token,
    success_url: `${window.location.origin}/success`,
    cancel_url: `${window.location.origin}/cancel`,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      mode,
      success_url: `${window.location.origin}/success`,
      cancel_url: `${window.location.origin}/cancel`,
    }),
  });

  console.log('📡 Réponse brute de la fonction stripe-checkout :', response);

  const data = await response.json();
  console.log('🧾 JSON retourné par la fonction stripe-checkout :', data);

  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Échec de la création de la session Stripe');
  }

  return data.url;
}

export async function redirectToCheckout(productId: keyof typeof STRIPE_PRODUCTS) {
  console.log('🎯 redirectToCheckout appelé avec :', productId);
  const product = STRIPE_PRODUCTS[productId];
  if (!product) {
    console.error('❌ Produit non trouvé dans STRIPE_PRODUCTS :', productId);
    throw new Error('Produit invalide');
  }

  const url = await createCheckoutSession(product.priceId, product.mode);
  console.log('🔗 URL Stripe reçue :', url);

  window.location.href = url;
}
