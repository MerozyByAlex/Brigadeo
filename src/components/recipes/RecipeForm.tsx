import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, X, Save } from 'lucide-react';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import clsx from 'clsx';

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  portions: number;
  restaurant_id: string;
  restaurant: {
    name: string;
  };
};

type RecipeFormProps = {
  initialData?: Recipe;
  onSuccess: () => void;
};

type Restaurant = {
  id: string;
  name: string;
};

export default function RecipeForm({ initialData, onSuccess }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [portions, setPortions] = useState(initialData?.portions ?? 1);
  const [restaurantId, setRestaurantId] = useState(initialData?.restaurant_id ?? '');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const showToast = useToast();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const profile = await getCurrentProfile();
        
        if (!profile.organization_id) {
          throw new Error("Aucune organisation trouvée");
        }

        const { data, error: fetchError } = await supabase
          .from('restaurant')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (fetchError) throw fetchError;
        setRestaurants(data || []);

        if (data && data.length === 1 && !initialData) {
          setRestaurantId(data[0].id);
        }
      } catch (err) {
        setError("Impossible de charger les restaurants");
        console.error(err);
      }
    };

    fetchRestaurants();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (trimmedName.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    if (!restaurantId) {
      setError('Veuillez sélectionner un restaurant');
      return;
    }

    if (portions < 1) {
      setError('Le nombre de portions doit être supérieur à 0');
      return;
    }

    setLoading(true);

    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const recipeData = {
        name: trimmedName,
        description: trimmedDescription || null,
        portions,
        restaurant_id: restaurantId,
        organization_id: profile.organization_id
      };

      let error;
      
      if (initialData) {
        ({ error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', initialData.id));
      } else {
        ({ error } = await supabase
          .from('recipes')
          .insert([recipeData]));
      }

      if (error) throw error;

      showToast({
        text: initialData
          ? "Recette mise à jour avec succès !"
          : "Recette créée avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Une erreur s'est produite lors de la ${initialData ? 'modification' : 'création'} de la recette`
      );
      console.error(err);
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="Nom de la recette" required>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
        />
      </FormField>

      <FormField label="Nombre de portions" required>
        <Input
          type="number"
          min="1"
          value={portions}
          onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
          required
        />
      </FormField>

      <FormField label="Restaurant" required>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionner un restaurant...</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex gap-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          icon={initialData && <Save className="h-4 w-4" />}
          className={clsx(
            'transition-all duration-300 ease-in-out',
            initialData && {
              'w-full': true
            },
            !initialData && 'w-full'
          )}
        >
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>

      {error && (
        <div
          className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
}