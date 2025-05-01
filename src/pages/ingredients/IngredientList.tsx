import { useEffect, useState } from 'react';
import { Plus, Pencil, LineChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { calculateCost } from '../../utils/costCalculator';
import Input from '../../components/ui/Input';
import { Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import IngredientForm from '../../components/ingredients/IngredientForm';
import PriceHistory from '../../components/ingredients/PriceHistory';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
  organization_id: string;
  created_at: string;
  lastProduct?: {
    price_cents: number;
    quantity: number;
  };
};

const UNIT_LABELS = {
  weight: 'Poids (g)',
  volume: 'Volume (ml)',
  unit: 'Unité'
};

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [showPriceHistory, setShowPriceHistory] = useState<Ingredient | null>(null);

  const fetchIngredients = async () => {
    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { data, error: ingredientError } = await supabase
        .from('ingredient')
        .select(`
          *,
          lastProduct:product(
            price_cents,
            quantity
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('date', { foreignTable: 'product', ascending: false })
        .limit(1, { foreignTable: 'product' })
        .order('name');

      if (ingredientError) throw ingredientError;
      
      // Transforme le tableau lastProduct en objet unique
      const ingredientsWithLastProduct = (data || []).map(ingredient => ({
        ...ingredient,
        lastProduct: ingredient.lastProduct?.[0]
      }));

      setIngredients(ingredientsWithLastProduct);
    } catch (err) {
      setError("Impossible de charger les ingrédients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedIngredient(null);
    fetchIngredients();
  };

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
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

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="mb-6">
        <Input
          type="text"
          label="Rechercher un ingrédient"
          icon={<Search className="h-5 w-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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

      <Modal
        isOpen={!!showPriceHistory}
        onClose={() => setShowPriceHistory(null)}
        title={showPriceHistory ? `Historique des prix - ${showPriceHistory.name}` : ''}
        size="lg"
        className="max-w-4xl w-full"
      >
        {showPriceHistory && (
          <PriceHistory
            ingredient_id={showPriceHistory.id}
            unit={showPriceHistory.unit}
          />
        )}
      </Modal>

      {ingredients.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore d'ingrédients.
        </div>
      )}

      {ingredients.length > 0 && filteredIngredients.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Aucun ingrédient ne correspond à votre recherche.
        </div>
      )}

      {filteredIngredients.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernier prix
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient) => (
                <tr key={ingredient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingredient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {UNIT_LABELS[ingredient.unit]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {ingredient.lastProduct ? (
                      `${(calculateCost(
                        ingredient.lastProduct.price_cents,
                        ingredient.lastProduct.quantity,
                        ingredient.unit,
                        ingredient.unit === 'weight' ? 1000 : 1
                      ) / 100).toFixed(2)} €${
                        ingredient.unit === 'weight' ? '/kg' :
                        ingredient.unit === 'volume' ? '/L' :
                        '/unité'
                      }`
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowPriceHistory(ingredient)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        aria-label="Voir l'historique des prix"
                      >
                        <LineChart className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(ingredient)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        aria-label="Modifier l'ingrédient"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}