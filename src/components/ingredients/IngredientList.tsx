import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import IngredientForm from './IngredientForm';

type Ingredient = {
   id: string;
   name: string;
   unit: 'weight' | 'volume' | 'unit';
   organization_id: string;
   created_at: string;
   category: {
     id: string;
     name: string;
     organization_id: string | null;
   } | null;
   lastProduct?: {
    price_cents: number;
    quantity: number;
     };
};
type IngredientFormData = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
  category_id: string | null;
};

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientFormData | null>(null);

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const profile = await getCurrentProfile();
        
        if (!profile.organization_id) {
          throw new Error("Aucune organisation trouvée");
        }

        const { data, error: ingredientError } = await supabase
          .from('ingredient')
          .select(`
            id,
            name,
            unit,
            organization_id,
            created_at,
            category (
              id,
              name,
              organization_id
            ),
            lastProduct:product (
              price_cents,
              quantity
            )
          `)
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (ingredientError) throw ingredientError;

        const ingredientsWithLastProduct: Ingredient[] = (data || []).map((ingredient) => {
          const category = Array.isArray(ingredient.category) 
            ? ingredient.category[0] 
            : ingredient.category ?? null;
          
          const lastProduct = Array.isArray(ingredient.lastProduct) 
            ? ingredient.lastProduct[0] 
            : ingredient.lastProduct;

          return {
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            organization_id: ingredient.organization_id,
            created_at: ingredient.created_at,
            category,
            ...(lastProduct && {
              lastProduct: {
                price_cents: lastProduct.price_cents,
                quantity: lastProduct.quantity
              }
            })
          };
        });

        setIngredients(ingredientsWithLastProduct);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les ingrédients"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchIngredients();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedIngredient(null);
    window.location.reload();
  };

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      category_id: ingredient.category?.id ?? null
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedIngredient(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Mes ingrédients</h1>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreate}
        >
          Ajouter un ingrédient
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIngredient(null);
        }}
        title={selectedIngredient ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
      >
        <IngredientForm
          initialData={selectedIngredient || undefined}
          onSuccess={handleSuccess}
        />
      </Modal>

      {ingredients.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore d'ingrédients.
        </div>
      ) : (
        <div className="space-y-4">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{ingredient.name}</h3>
                  <p className="text-gray-500">Unité : {ingredient.unit}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => handleEdit(ingredient)}
                >
                  Modifier
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}