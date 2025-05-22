import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import Button from '../ui/Button';
import ProductFormRow from './ProductFormRow';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

export type ProductFormValue = {
  ingredient_id: string;
  label?: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
};

type ProductMultiFormProps = {
  ingredients: Ingredient[];
  onSuccess: () => void;
  onFillAI?: (fill: (products: ProductFormValue[]) => void) => void;
};

const UNIT_OPTIONS = {
  weight: [
    { value: 'kg', label: 'Kilogrammes (kg)', factor: 1000 },
    { value: 'g', label: 'Grammes (g)', factor: 1 }
  ],
  volume: [
    { value: 'l', label: 'Litres (L)', factor: 1000 },
    { value: 'ml', label: 'Millilitres (mL)', factor: 1 }
  ],
  unit: [
    { value: 'unit', label: 'Unité(s)', factor: 1 }
  ]
};

const DEFAULT_PRODUCT: ProductFormValue = {
  ingredient_id: '',
  label: '',
  quantity: 0,
  unit: '',
  price: 0,
  date: new Date().toISOString().slice(0, 16)
};

const convertToBasicUnit = (value: number, unit: string, type: 'weight' | 'volume' | 'unit'): number => {
  const options = UNIT_OPTIONS[type];
  const option = options.find(opt => opt.value === unit);
  return option ? value * option.factor : value;
};

export default function ProductMultiForm({ ingredients, onSuccess, onFillAI }: ProductMultiFormProps) {
  const [products, setProducts] = useState<ProductFormValue[]>([{ ...DEFAULT_PRODUCT }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (onFillAI) {
      onFillAI((products) => setProducts(products));
    }
  }, [onFillAI]);

  const handleAddProduct = () => {
    setProducts([...products, { ...DEFAULT_PRODUCT }]);
  };

  const handleProductChange = (index: number, value: ProductFormValue) => {
    const newProducts = [...products];
    newProducts[index] = value;
    setProducts(newProducts);
  };

  const handleDeleteProduct = (index: number) => {
    if (products.length === 1) {
      return;
    } else {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation approfondie
      const invalidProducts = products.filter(p => {
        const hasRequiredFields = p.ingredient_id && p.quantity > 0 && p.price > 0;
        const hasValidDate = Date.parse(p.date);
        return !hasRequiredFields || !hasValidDate;
      });

      if (invalidProducts.length > 0) {
        throw new Error(
          'Veuillez remplir correctement tous les champs obligatoires (ingrédient, quantité > 0, prix > 0 et date valide)'
        );
      }

      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error('Aucune organisation trouvée');
      }

      // Préparation des données pour l'insertion
      const productsToInsert = products.map(product => {
        const ingredient = ingredients.find(i => i.id === product.ingredient_id);
        if (!ingredient) {
          throw new Error('Ingrédient non trouvé');
        }

        // Conversion en unité de base (g, ml, ou unité)
        const quantity = convertToBasicUnit(
          product.quantity,
          product.unit,
          ingredient.unit
        );

        return {
          ingredient_id: product.ingredient_id,
          organization_id: profile.organization_id,
          label: product.label || null,
          quantity,
          price_cents: Math.round(product.price * 100),
          date: product.date || new Date().toISOString().slice(0, 10)
        };
      });

      const { error: insertError } = await supabase
        .from('product')
        .insert(productsToInsert);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de l'enregistrement des produits."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-8">
        {products.map((product, index) => (
          <ProductFormRow
            key={index}
            value={product}
            showLabels={index === 0}
            ingredients={ingredients}
            onChange={value => handleProductChange(index, value)}
            onDelete={index === 0 ? undefined : () => handleDeleteProduct(index)}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddProduct}
          icon={<Plus className="h-4 w-4" />}
        >
          Ajouter un produit
        </Button>

        <Button
          type="submit"
          loading={loading}
          disabled={loading || products.length === 0}
          className="flex-1"
        >
          Valider tous les produits
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