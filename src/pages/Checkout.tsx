import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { redirectToCheckout } from '../services/stripe';
import Button from '../components/ui/Button';

export default function Checkout() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  console.log('🌀 Checkout page loaded');

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        console.log('🌀 Checkout page loaded → lancement de redirectToCheckout');
        await redirectToCheckout('BRIGADEO_PRO');
        console.log('✅ Redirection vers Stripe lancée (ou terminée)');
      } catch (err) {
        console.error('❌ Erreur lors du processus de redirection :', err);
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors de la redirection vers la page de paiement"
        );
      }
    };

    initiateCheckout();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/')}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Retourner à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">
          Redirection vers la page de paiement...
        </p>
      </div>
    </div>
  );
}
