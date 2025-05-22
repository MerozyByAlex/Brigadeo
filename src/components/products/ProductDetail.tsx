import { useState } from 'react';
import { FileText, Package, CalendarDays, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/date';
import { calculateCost } from '../../utils/costCalculator';
import Button from '../ui/Button';

type ProductDetailProps = {
  product: {
    id: string;
    ingredient: {
      id: string;
      name: string;
      unit: 'weight' | 'volume' | 'unit';
    };
    raw_label?: string | null;
    quantity: number;
    price_cents: number;
    date: string;
    invoice_id?: string | null;
    storage_path?: string | null;
  };
};

const formatQuantity = (quantity: number, unit: 'weight' | 'volume' | 'unit') => {
  switch (unit) {
    case 'weight':
      return quantity >= 1000 ? `${(quantity / 1000).toFixed(2)} kg` : `${quantity} g`;
    case 'volume':
      return `${quantity} L`;
    case 'unit':
      return `${quantity} unité${quantity > 1 ? 's' : ''}`;
  }
};

const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} €`;

export default function ProductDetail({ product }: ProductDetailProps) {
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const handleViewInvoice = async () => {
    if (!product.storage_path) return;

    try {
      setLoadingInvoice(true);
      const { data, error } = await supabase.storage
  .from('invoices')
  .createSignedUrl(product.storage_path, 3600);

const signedUrl = data?.signedUrl;

      if (error || !signedUrl) throw error || new Error("URL non générée");
      window.open(signedUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert("Impossible d'accéder à la facture.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const unitPrice = product.ingredient
    ? calculateCost(
        product.price_cents,
        product.quantity,
        product.ingredient.unit,
        product.ingredient.unit === 'weight' ? 1000 : 1
      )
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-400" />
          {product.ingredient?.name || 'Produit non identifié'}
        </h2>
        {product.raw_label && product.raw_label !== product.ingredient?.name && (
          <p className="text-sm text-gray-500 italic ml-7">Sur la facture : “{product.raw_label}”</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <Tag className="w-4 h-4 mt-0.5 text-gray-400" />
          <div>
            <p className="text-gray-500">Quantité</p>
            <p className="font-medium text-gray-900">
              {product.ingredient
                ? formatQuantity(product.quantity, product.ingredient.unit)
                : `${product.quantity}`}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Tag className="w-4 h-4 mt-0.5 text-gray-400" />
          <div>
            <p className="text-gray-500">Prix total</p>
            <p className="font-medium text-gray-900">{formatPrice(product.price_cents)}</p>
          </div>
        </div>

        {unitPrice !== null && (
          <div className="flex items-start gap-3">
            <Tag className="w-4 h-4 mt-0.5 text-gray-400" />
            <div>
              <p className="text-gray-500">Prix unitaire</p>
              <p className="font-medium text-gray-900">
                {formatPrice(unitPrice)}
                {product.ingredient?.unit === 'weight' && ' /kg'}
                {product.ingredient?.unit === 'volume' && ' /L'}
                {product.ingredient?.unit === 'unit' && ' /unité'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <CalendarDays className="w-4 h-4 mt-0.5 text-gray-400" />
          <div>
            <p className="text-gray-500">Date d'achat</p>
            <p className="font-medium text-gray-900">{formatDate(product.date)}</p>
          </div>
        </div>
      </div>

      {product.invoice_id && product.storage_path && (
        <div className="pt-4 border-t border-gray-100">
          <Button
            onClick={handleViewInvoice}
            loading={loadingInvoice}
            variant="outline"
            icon={<FileText className="w-4 h-4" />}
          >
            Voir la facture liée
          </Button>
        </div>
      )}
    </div>
  );
}
