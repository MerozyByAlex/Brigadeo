import { STRIPE_PRODUCTS } from '../stripe-config';
import { getSessionToken } from '../utils/auth';

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  const { VITE_EDGE_FUNCTION_URL } = import.meta.env;
  const token = await getSessionToken();
  const profile = await getCurrentProfile();

  if (!profile.organization_id) {
    throw new Error('Vous devez être membre d\'une organisation pour souscrire à un abonnement');
  }

  const endpoint = `${VITE_EDGE_FUNCTION_URL}/stripe-checkout`;

  console.log('📨 Appel à Stripe Checkout :', {
    endpoint,
    price_id: priceId,
    mode,
    token,
    success_url: `${window.location.origin}/success`,
    cancel_url: `${window.location.origin}/cancel`,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      mode,
      organization_id: profile.organization_id,
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
