import { useState, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useHasChanged } from '../../hooks/useHasChanged';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RecipeIngredientRow from './RecipeIngredientRow';
import clsx from 'clsx';

type Restaurant = {
  id: string;
  name: string;
};

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  restaurant_id: string;
  portions: number;
};

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

type RecipeIngredient = {
  ingredient_id: string;
  quantity: number;
};

type RecipeFormProps = {
  initialData?: Recipe;
  onSuccess: () => void;
};

export default function RecipeForm({ initialData, onSuccess }: RecipeFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portions, setPortions] = useState<number>(1);
  const [restaurantId, setRestaurantId] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [nameError, setNameError] = useState('');
  const [restaurantError, setRestaurantError] = useState('');
  const [ingredientsError, setIngredientsError] = useState('');
  const [portionsError, setPortionsError] = useState('');

  const hasChanged = useHasChanged(
    {
      name: initialData?.name,
      description: initialData?.description,
      restaurant_id: initialData?.restaurant_id,
      portions: initialData?.portions,
    },
    {
      name: name.trim(),
      description: description.trim(),
      restaurant_id: restaurantId,
      portions,
    }
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!profile.organization_id) throw new Error('Aucune organisation trouvée');

        const { data, error } = await supabase
          .from('restaurant')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (error) throw error;
        setRestaurants(data || []);

        if (data && data.length === 1 && !initialData) {
          setRestaurantId(data[0].id);
        }
      } catch (err) {
        setGlobalError("Impossible de charger les restaurants");
        console.error(err);
      }
    };

    fetchRestaurants();
  }, [initialData]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile.organization_id) throw new Error('Aucune organisation trouvée');

        const { data, error } = await supabase
          .from('ingredient')
          .select('id, name, unit')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (error) throw error;
        setIngredients(data || []);
      } catch (err) {
        setGlobalError("Impossible de charger les ingrédients");
        console.error(err);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? '');
      setPortions(initialData.portions);
      setRestaurantId(initialData.restaurant_id);

      const fetchRecipeIngredients = async () => {
        try {
          const { data, error } = await supabase
            .from('recipe_ingredients')
            .select('ingredient_id, quantity')
            .eq('recipe_id', initialData.id);

          if (error) throw error;
          setRecipeIngredients(data || []);
        } catch (err) {
          console.error(err);
          setGlobalError("Impossible de charger les ingrédients de la recette");
        }
      };

      fetchRecipeIngredients();
    } else {
      setName('');
      setDescription('');
      setPortions(1);
      setRestaurantId('');
      setRecipeIngredients([]);
    }
  }, [initialData?.id]);

  const handleAddIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: '', quantity: 0 }]);
  };

  const handleIngredientChange = (index: number, value: RecipeIngredient) => {
    const newIngredients = [...recipeIngredients];
    newIngredients[index] = value;
    setRecipeIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setNameError('');
    setRestaurantError('');
    setPortionsError('');
    setIngredientsError('');

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (trimmedName.length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    if (!restaurantId) {
      setRestaurantError('Veuillez sélectionner un restaurant');
      return;
    }

    if (portions < 1) {
      setPortionsError('Le nombre de portions doit être supérieur ou égal à 1');
      return;
    }

    const validIngredients = recipeIngredients.filter(
      ing => ing.ingredient_id && ing.quantity > 0
    );

    if (validIngredients.length === 0) {
      setIngredientsError('Ajoutez au moins un ingrédient avec une quantité valide');
      return;
    }

    setLoading(true);

    try {
      let recipeId = initialData?.id;

      if (initialData) {
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ name: trimmedName, description: trimmedDescription || null, restaurant_id: restaurantId, portions })
          .eq('id', initialData.id);

        if (updateError) throw updateError;

        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', initialData.id);
      } else {
        const { data: newRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert([{ name: trimmedName, description: trimmedDescription || null, restaurant_id: restaurantId, portions }])
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newRecipe) throw new Error("Erreur lors de la création de la recette");
        recipeId = newRecipe.id;
      }

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(
          validIngredients.map(ing => ({ recipe_id: recipeId, ingredient_id: ing.ingredient_id, quantity: ing.quantity }))
        );

      if (ingredientsError) throw ingredientsError;

      if (!initialData) {
        setName('');
        setDescription('');
        setPortions(1);
        setRestaurantId(restaurants.length === 1 ? restaurants[0].id : '');
        setRecipeIngredients([]);
      }
      onSuccess();
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : `Une erreur s'est produite lors de la ${initialData ? 'modification' : 'création'} de la recette`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;

    if (!window.confirm('Etes-vous sûr de vouloir supprimer cette recette ?')) return;

    setLoading(true);
    setGlobalError('');

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', initialData.id);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Erreur lors de la suppression de la recette");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  console.log("📦 initialData reçue :", initialData);


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nom de la recette" error={nameError} required>
        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>

      <FormField label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
        />
      </FormField>

      <FormField label="Nombre de portions" error={portionsError} required>
        <Input
          type="number"
          min="1"
          value={portions}
          onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
          required
        />
      </FormField>

      {restaurants.length > 1 && (
        <FormField label="Restaurant" error={restaurantError} required>
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
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ingrédients de la recette</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} icon={<Plus className="h-4 w-4" />}>
            Ajouter un ingrédient
          </Button>
        </div>

        {recipeIngredients.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun ingrédient ajouté</p>
        ) : (
          <div className="space-y-4">
            {recipeIngredients.map((ingredient, index) => (
              <RecipeIngredientRow
                key={index}
                value={ingredient}
                ingredients={ingredients}
                onChange={(value) => handleIngredientChange(index, value)}
                onDelete={() => handleRemoveIngredient(index)}
                showLabels={index === 0}
              />
            ))}
          </div>
        )}

        {ingredientsError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {ingredientsError}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          icon={initialData && <Save className="h-4 w-4" />}
          className={clsx(
            'transition-all duration-300 ease-in-out',
            initialData && {
              'w-1/2': !hasChanged,
              'w-3/4': hasChanged,
            },
            !initialData && 'w-full'
          )}
        >
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>

        {initialData && (
          <Button
            type="button"
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            disabled={loading}
            className={clsx(
              'transition-all duration-300 ease-in-out',
              'w-1/2',
              hasChanged && 'w-1/4'
            )}
          >
            Supprimer
          </Button>
        )}
      </div>

      {globalError && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
          {globalError}
        </div>
      )}
    </form>
  );
}
