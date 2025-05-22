import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Dropdown from './ui/Dropdown';
import Button from './ui/Button';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-800">
            Brigadéo
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/produits/saisie"
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
                to="/factures"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Factures
              </Link>
              <Link
                to="/recettes"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Recettes
              </Link>
              <Link
                to="/produits"
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
              <Link
                to="/test-back"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Test Back
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
          </div>
        </div>
      </div>
    </nav>
  );
}