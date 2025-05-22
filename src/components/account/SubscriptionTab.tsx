import { useState, useEffect } from 'react';
import { getSubscriptionByOrganization } from '../../lib/subscription';
import { getCurrentProfile } from '../../utils/auth';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { createPortalSession } from '../../lib/stripe';
import { useToast } from '../../hooks/useToast';

type SubscriptionInfo = {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
};

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'canceled':
      return 'text-red-600 bg-red-50';
    case 'past_due':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'canceled':
      return 'Annulé';
    case 'past_due':
      return 'Paiement en retard';
    case 'incomplete':
      return 'Incomplet';
    case 'incomplete_expired':
      return 'Expiré';
    case 'trialing':
      return 'Période d\'essai';
    case 'unpaid':
      return 'Impayé';
    case 'paused':
      return 'En pause';
    default:
      return 'Inconnu';
  }
};

export default function SubscriptionTab() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  const handleManageSubscription = async () => {
    try {
      setRedirecting(true);
      const profile = await getCurrentProfile();
      if (!profile.organization_id) {
        throw new Error('Aucune organisation trouvée');
      }
      const url = await createPortalSession(profile.organization_id);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      showToast({
        text: "Une erreur s'est produite",
        color: 'error',
        icon: <AlertCircle className="h-4 w-4" />
      });
      setRedirecting(false);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile.organization_id) {
          throw new Error('Aucune organisation trouvée');
        }

        const data = await getSubscriptionByOrganization(profile.organization_id);
        setSubscription(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-600">Vous n'avez pas encore d'abonnement actif.</p>
        <Button onClick={() => navigate('/checkout')}>
          S'abonner maintenant
        </Button>
      </div>
    );
  }

  const isActive = subscription.subscription_status === 'active';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">BrigadIA PRO</h3>
            <p className="mt-1 text-sm text-gray-500">
              Accès complet à toutes les fonctionnalités
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
            {getStatusLabel(subscription.subscription_status)}
          </div>
        </div>

        <div className="p-4 grid gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-600">Début de l'abonnement</p>
              <p className="font-medium text-gray-900">
                {formatDate(subscription.current_period_start)}
              </p>
            </div>
          </div>

          {subscription.current_period_end && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-600">Prochaine facturation</p>
                <p className="font-medium text-gray-900">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
          )}

          {subscription.payment_method_brand && (
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-600">Moyen de paiement</p>
                <p className="font-medium text-gray-900">
                  {subscription.payment_method_brand.charAt(0).toUpperCase() + 
                   subscription.payment_method_brand.slice(1)} •••• {subscription.payment_method_last4}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <Button
            variant={isActive ? 'outline' : 'primary'}
            onClick={isActive ? handleManageSubscription : () => navigate('/checkout')}
            loading={redirecting}
            fullWidth
          >
            {isActive ? 'Gérer mon abonnement' : 'S\'abonner maintenant'}
          </Button>
        </div>
      </div>
    </div>
  );
}