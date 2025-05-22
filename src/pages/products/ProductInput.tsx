import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { analyzeInvoice } from '../../services/invoice';
import { mapAIResponseToFormData } from '../../utils/aiMapping';
import ProductMultiForm from '../../components/products/ProductMultiForm';
import type { ProductFormValue } from '../../components/products/ProductMultiForm';
import { FileText, Loader2 } from 'lucide-react';
import SelectInvoiceModal from '../../components/invoices/SelectInvoiceModal';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

export default function ProductInput() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [initialProducts, setInitialProducts] = useState<ProductFormValue[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const startTimeRef = useRef<number>(0);

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

  const handleInvoiceSelect = async (storagePath: string) => {
    setShowInvoiceModal(false);
    setAiError(null);
    
    setAnalyzing(true);
    
    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        setAiError("Impossible d'analyser la facture : aucune organisation trouvée");
        return;
      }

      const aiData = await analyzeInvoice(storagePath, profile.organization_id);      
      console.log('[🧠 OpenAI JSON]', JSON.stringify(aiData, null, 2));
      
      const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
      console.log(`✅ Analyse IA terminée en ${duration} secondes`);
      
      const mapped = mapAIResponseToFormData(aiData, ingredients);
      setInitialProducts(mapped.map(item => ({
        ...item,
        date: typeof item.date === 'string' ? item.date : item.date.toISOString()
      })));
    } catch (err) {
      const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
      console.log(`✅ Analyse IA terminée en ${duration} secondes`);
      console.error(err);
      setAiError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'analyse de la facture"
      );
    } finally {
      setAnalyzing(false);
    }
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

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => {
            startTimeRef.current = Date.now();
            setShowInvoiceModal(true);
          }}
          icon={<FileText className="h-4 w-4" />}
        >
          Remplir depuis une facture
        </Button>
      </div>
      
      {aiError && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
          {aiError}
        </div>
      )}

      {analyzing ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            Analyse de votre facture en cours... Cela ne prendra que quelques instants.
          </p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="text-center text-gray-500">
          Vous devez d'abord créer des ingrédients avant de pouvoir saisir des produits.
        </div>
      ) : (
        <ProductMultiForm
          ingredients={ingredients}
          onSuccess={handleSuccess}
          onFillAI={(fill) => {
            if (initialProducts) {
              fill(initialProducts);
              setInitialProducts(null);
            }
          }}
        />
      )}

      <SelectInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSelect={handleInvoiceSelect}
      />
    </div>
  );
}