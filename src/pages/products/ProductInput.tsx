import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import ProductMultiForm from '../../components/products/ProductMultiForm';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

export default function ProductInput() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const profile = await getCurrentProfile();
        
        if (!profile.organization_id) {
          throw new Error("Aucune organisation trouvée");
        }

        const { data, error: ingredientError } = await supabase
          .from('ingredient')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (ingredientError) throw ingredientError;

        setIngredients(data || []);
      } catch (err) {
        setError("Impossible de charger les ingrédients");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const handleSuccess = () => {
    navigate('/produits');
  };

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Saisie de produits
      </h1>
      
      {ingredients.length === 0 ? (
        <div className="text-center text-gray-500">
          Vous devez d'abord créer des ingrédients avant de pouvoir saisir des produits.
        </div>
      ) : (
        <ProductMultiForm
          ingredients={ingredients}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}