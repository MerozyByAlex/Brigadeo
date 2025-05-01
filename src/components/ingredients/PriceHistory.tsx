import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { calculateCost } from '../../utils/costCalculator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type PriceHistoryProps = {
  ingredient_id: string;
  unit: 'weight' | 'volume' | 'unit';
};

type Product = {
  date: string;
  label: string | null;
  quantity: number;
  price_cents: number;
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatUnitPrice = (cents: number, unit: 'weight' | 'volume' | 'unit') => {
  const price = (cents / 100).toFixed(2);
  switch (unit) {
    case 'weight':
      return `${price} €/kg`;
    case 'volume':
      return `${price} €/L`;
    case 'unit':
      return `${price} €/unité`;
  }
};

export default function PriceHistory({ ingredient_id, unit }: PriceHistoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('product')
          .select('date, label, quantity, price_cents')
          .eq('ingredient_id', ingredient_id)
          .order('date', { ascending: false });

        if (fetchError) throw fetchError;
        setProducts(data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement de l'historique"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [ingredient_id]);

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
      <div className="text-center text-gray-500">
        Aucun historique de prix disponible.
      </div>
    );
  }

  const chartData = products
    .map(product => ({
      date: new Date(product.date).getTime(),
      price: calculateCost(
        product.price_cents,
        product.quantity,
        unit,
        unit === 'weight' ? 1000 : 1
      ) / 100
    }))
    .sort((a, b) => a.date - b.date);

  const lastUnitPrice = chartData.at(-1)?.price;
  const priceTrend = chartData.length > 1
    ? chartData.at(-1)!.price - chartData[0].price
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Évolution du prix unitaire</h3>
        <p className="text-sm text-gray-500">
          Dernier prix : <span className="font-medium text-gray-700">{lastUnitPrice?.toFixed(2)} €{unit === 'weight' ? '/kg' : unit === 'volume' ? '/L' : '/unité'}</span> — {products.length} enregistrements
          <br />
          Tendance : {priceTrend > 0 ? 'hausse 📈' : priceTrend < 0 ? 'baisse 📉' : 'stable ➖'}
        </p>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
              formatter={(value: number) => [
                `${value.toFixed(2)} €${unit === 'weight' ? '/kg' : unit === 'volume' ? '/L' : '/unité'}`,
                'Prix'
              ]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => {
              const unitPrice = calculateCost(
                product.price_cents,
                product.quantity,
                unit,
                unit === 'weight' ? 1000 : 1
              );
              return (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(product.date)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {product.label || '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatUnitPrice(unitPrice, unit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
