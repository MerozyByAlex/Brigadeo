import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import RestaurantForm from '../../components/restaurants/RestaurantForm';
import RestaurantCard from '../../components/restaurants/RestaurantCard';

type Restaurant = {
  id: string;
  name: string;
  created_at: string;
};

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const fetchRestaurants = async () => {
    try {
      const profile = await getCurrentProfile();

      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { data, error } = await supabase
        .from('restaurant')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      setError("Impossible de charger les restaurants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedRestaurant(null);
    fetchRestaurants();
  };

  const handleEdit = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRestaurant(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mes restaurants</h1>
        <Button
          onClick={handleCreate}
          icon={<Plus className="h-4 w-4" />}
        >
          Créer un restaurant
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRestaurant(null);
        }}
        title={selectedRestaurant ? 'Modifier le restaurant' : 'Créer un restaurant'}
      >
        <RestaurantForm
          initialData={selectedRestaurant || undefined}
          onSuccess={handleSuccess}
        />
      </Modal>

      {restaurants.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore de restaurant.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              {...restaurant}
              onEdit={() => handleEdit(restaurant)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
