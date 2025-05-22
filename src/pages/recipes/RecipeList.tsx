import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import RecipeForm from '../../components/recipes/RecipeForm';
import RecipeDetail from '../../components/recipes/RecipeDetail';
import RecipeCard from '../../components/recipes/RecipeCard';

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

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      const profile = await getCurrentProfile();

      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { data, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          description,
          portions,
          restaurant_id,
          restaurant:restaurant_id (
            name
          )
        `)
        .order('name');

      if (recipesError) throw recipesError;
      const cleanedData = (data || []).map(recipe => ({
        ...recipe,
        restaurant: Array.isArray(recipe.restaurant)
          ? recipe.restaurant[0]
          : recipe.restaurant
      }));

      setRecipes(cleanedData);
    } catch (err) {
      setError("Impossible de charger les recettes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
    fetchRecipes();
  };

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRecipe(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Mes recettes</h1>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreate}
        >
          Créer une recette
        </Button>
      </div>

      <Modal
        size="lg"
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecipe(null);
        }}
        title={selectedRecipe ? "Modifier la recette" : "Créer une recette"}
      >
        <RecipeForm
          initialData={selectedRecipe || undefined}
          onSuccess={handleSuccess}
        />
      </Modal>

      <Modal
        size="lg"
        isOpen={!!selectedRecipeForDetails}
        onClose={() => setSelectedRecipeForDetails(null)}
        title="Détails de la recette"
      >
        {selectedRecipeForDetails && (
          <RecipeDetail
            recipeId={selectedRecipeForDetails}
            onClose={() => setSelectedRecipeForDetails(null)}
            onEdit={(recipe) => {
              setSelectedRecipeForDetails(null);
              handleEdit(recipe);
            }}
          />
        )}
      </Modal>

      {recipes.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore de recettes.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              name={recipe.name}
              restaurantName={recipe.restaurant.name}
              onClick={() => setSelectedRecipeForDetails(recipe.id)}
              onEdit={() => handleEdit(recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}