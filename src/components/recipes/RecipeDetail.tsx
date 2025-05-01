// components/recipes/RecipeDetail.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { calculateCost } from '../../utils/costCalculator';
import Button from '../ui/Button';
import { X } from 'lucide-react';

type RecipeDetailProps = {
  recipeId: string;
  onClose: () => void;
};

type RecipeDetails = {
  id: string;
  name: string;
  portions: number;
  description: string | null;
  restaurant: {
    name: string;
  };
  ingredients: {
    id: string;
    name: string;
    unit: 'weight' | 'volume' | 'unit';
    quantity: number;
    costCents?: number;
  }[];
};

const UNIT_LABELS = {
  weight: 'grammes',
  volume: 'millilitres',
  unit: 'unité(s)',
};

export default function RecipeDetail({ recipeId, onClose }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select(`
            id,
            name,
            portions,
            description,
            restaurant:restaurant_id (
              name
            )
          `)
          .eq('id', recipeId)
          .single();

        if (recipeError) throw recipeError;
        if (!recipeData) throw new Error('Recette non trouvée');

        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select(`
            quantity,
            ingredient:ingredient_id (
              id,
              name,
              unit
            )
          `)
          .eq('recipe_id', recipeId);

        if (ingredientsError) throw ingredientsError;

        const ingredientsWithCosts = await Promise.all(
          (ingredientsData || []).map(async (item) => {
            const { data: productData } = await supabase
              .from('product')
              .select('price_cents, quantity')
              .eq('ingredient_id', item.ingredient.id)
              .order('date', { ascending: false })
              .limit(1)
              .single();

            const costCents = productData
              ? calculateCost(
                  productData.price_cents,
                  productData.quantity,
                  item.ingredient.unit,
                  item.quantity
                )
              : undefined;

            return {
              id: item.ingredient.id,
              name: item.ingredient.name,
              unit: item.ingredient.unit,
              quantity: item.quantity,
              costCents,
            };
          })
        );

        setRecipe({
          ...recipeData,
          ingredients: ingredientsWithCosts,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement de la recette"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [recipeId]);

  if (loading) return <div className="text-center">Chargement...</div>;

  if (error || !recipe) {
    return (
      <div className="text-red-600 text-center">
        {error || "Impossible de charger la recette"}
      </div>
    );
  }

  const totalCostCents = recipe.ingredients.reduce((sum, ingredient) => {
    return sum + (ingredient.costCents || 0);
  }, 0);

  const totalCost = totalCostCents / 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{recipe.name}</h2>
        <p className="text-gray-500">{recipe.portions} portion{recipe.portions > 1 ? 's' : ''}</p>
        <p className="text-gray-600">Restaurant : {recipe.restaurant.name}</p>
      </div>

      {recipe.description && (
        <div className="prose max-w-none">
          <p className="text-gray-600">{recipe.description}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ingrédients
        </h3>
        <div className="space-y-3">
          {recipe.ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex items-center justify-between py-2 border-b border-gray-200"
            >
              <div>
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-gray-600 ml-2">
                  {ingredient.quantity} {UNIT_LABELS[ingredient.unit]}
                </span>
              </div>
              {ingredient.costCents !== undefined && (
                <span className="text-gray-600">
                  {(ingredient.costCents / 100).toFixed(2)} €
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {totalCost > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-lg font-semibold text-gray-900">
            Coût total estimé : {totalCost.toFixed(2)} € 
            {recipe.portions > 0 && (
              <span className="text-base font-normal text-gray-600 ml-2">
                (soit {(totalCost / recipe.portions).toFixed(2)} € par portion)
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Basé sur les derniers prix d'achat des ingrédients
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          icon={<X className="h-4 w-4" />}
        >
          Fermer
        </Button>
      </div>
    </div>
  );
}
