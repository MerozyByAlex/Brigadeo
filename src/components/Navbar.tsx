import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
    </nav>
  );
}