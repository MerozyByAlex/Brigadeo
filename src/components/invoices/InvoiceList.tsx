import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/date';

type Invoice = {
  id: string;
  date: string;
  storage_path: string;
  supplier: string | null;
  restaurant: { name: string };
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error: fetchError } = await supabase
        .from('invoice')
        .select(`
          id,
          date,
          storage_path,
          supplier,
          restaurant:restaurant_id!inner (
            name
          )
        `)
        .order('date', { ascending: false });

      if (fetchError) {
        setError("Erreur lors du chargement des factures");
        console.error(fetchError);
      } else {
        const parsed = (data || []).map((item: any): Invoice => ({
          id: item.id,
          date: item.date,
          storage_path: item.storage_path,
          supplier: item.supplier,
          restaurant: {
            name: item.restaurant?.name ?? '—',
          },
        }));
        setInvoices(parsed);
      }
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Restaurant
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(invoice.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invoice.restaurant.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}