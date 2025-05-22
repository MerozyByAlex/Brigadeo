import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_organization_subscriptions')
          .select('subscription_status')
          .maybeSingle();

        if (error) throw error;
        setHasSubscription(data?.subscription_status === 'active');
      } catch (err) {
        console.error(err);
        setHasSubscription(false);
      }
    };

    checkSubscription();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Bienvenue sur {hasSubscription ? 'Brigadéo Pro' : 'Brigadéo'}
        </h1>
        <p className="text-xl text-gray-600">
          La solution intelligente pour la gestion de vos factures de restaurant
        </p>
      </div>

      {hasSubscription === false && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm border border-blue-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Passez votre organisation à BrigadIA PRO
            </h2>
            <p className="text-gray-600 mb-8">
              Débloquez toutes les fonctionnalités avancées et optimisez la gestion de vos restaurants avec l'analyse automatique de factures par IA.
            </p>
            <Button
              onClick={() => navigate('/checkout')}
              icon={<ArrowRight className="h-4 w-4" />}
              size="lg"
            >
              S'abonner à BrigadIA PRO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}