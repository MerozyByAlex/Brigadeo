import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Dropdown from './ui/Dropdown';
import Button from './ui/Button';

export default function Navbar() {
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-800">
            {hasSubscription ? 'Brigadéo Pro' : 'Brigadéo'}
          </Link>
          <div className="flex items-center gap-4">
            
            <Link
              to="/products/input"
              className="text-gray-700 hover:text-gray-900"
            >
              Saisir des produits
            </Link>
            <Dropdown trigger="Gestion">
              <Link
                to="/restaurants"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Restaurants
              </Link>
              <Link
                to="/invoices"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Factures
              </Link>
              <Link
                to="/recipes"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Recettes
              </Link>
              <Link
                to="/products"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Produits
              </Link>
              <Link
                to="/ingredients"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Ingrédients
              </Link>
            </Dropdown>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="h-4 w-4" />}
            >
              Déconnexion
            </Button>
            <Link
              to="/compte"
              className="text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}