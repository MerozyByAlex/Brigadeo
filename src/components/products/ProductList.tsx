import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import Modal from '../../components/ui/Modal';
import ProductDetail from '../../components/products/ProductDetail';
import { calculateCost } from '../../utils/costCalculator';

type Product = {
  id: string;
  ingredient: {
    id: string;
    name: string;
    unit: 'weight' | 'volume' | 'unit';
  };
  label: string | null;
  raw_label: string | null;
  quantity: number;
  price_cents: number;
  date: string;
  created_at: string;
  invoice_id: string | null;
};

const formatQuantity = (quantity: number, unit: 'weight' | 'volume' | 'unit') => {
  switch (unit) {
    case 'weight':
      return quantity >= 1000
        ? `${(quantity / 1000).toFixed(2)} kg`
        : `${quantity} g`;
    case 'volume':
      return `${quantity} L`;
    case 'unit':
      return `${quantity} unité${quantity > 1 ? 's' : ''}`;
    default:
      return quantity.toString();
  }
};

const formatPrice = (cents: number) => {
  return `${(cents / 100).toFixed(2)} €`;
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!profile.organization_id) {
          throw new Error("Aucune organisation trouvée");
        }

        const { data, error: fetchError } = await supabase
          .from('product')
          .select(`
            id,
            ingredient:ingredient_id!inner (
              id,
              name,
              unit
            ),
            raw_label,
            label,
            quantity,
            price_cents,
            date,
            created_at,
            invoice_id
          `)
          .eq('organization_id', profile.organization_id)
          .order('date', { ascending: false });

        if (fetchError) throw fetchError;
        setProducts((data || []).map((p: any) => ({
  ...p,
  ingredient: Array.isArray(p.ingredient) ? p.ingredient[0] : p.ingredient,
})));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des produits"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded bg-red-50 border border-red-200 text-red-600">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
        </div>
        <div className="text-center text-gray-500 mt-8">
          Aucun produit enregistré.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="cursor-pointer">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingrédient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Libellé
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantité
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coût unitaire
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => product.ingredient && setSelectedProduct(product)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(product.date).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.ingredient?.name || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.label || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {product.ingredient && formatQuantity(product.quantity, product.ingredient.unit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatPrice(product.price_cents)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {product.ingredient && formatPrice(calculateCost(
                    product.price_cents,
                    product.quantity,
                    product.ingredient.unit,
                    product.ingredient.unit === 'weight' ? 1000 : 1
                  ))}
                  {product.ingredient?.unit === 'weight' && '/kg'}
                  {product.ingredient?.unit === 'volume' && '/L'}
                  {product.ingredient?.unit === 'unit' && '/unité'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Détails du produit"
      >
        {selectedProduct && <ProductDetail product={selectedProduct} />}
      </Modal>
    </div>
  );
}