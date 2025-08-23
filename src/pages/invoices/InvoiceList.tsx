import { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { formatDate } from '../../utils/date';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import UploadInvoiceForm from '../../components/invoices/UploadInvoiceForm';
import InvoiceDetailModal from '../../components/invoices/InvoiceDetailModal';

type Invoice = {
  id: string;
  invoice_date: string;
  storage_path: string;
  supplier: { name: string } | null;
  restaurant: {
    name: string;
  };
};

export default function InvoiceList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoiceId') || '';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { data, error: fetchError } = await supabase
        .from('invoice')
        .select(`
          id,
          invoice_date,
          storage_path,
          supplier:supplier_id (
            name
          ),
          restaurant:restaurant_id (
            name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('invoice_date', { ascending: false });

      if (fetchError) throw fetchError;
      const formattedInvoices = (data || []).map(invoice => ({
        ...invoice,
        supplier: Array.isArray(invoice.supplier) ? invoice.supplier[0] : invoice.supplier,
        restaurant: Array.isArray(invoice.restaurant) ? invoice.restaurant[0] : invoice.restaurant,
      }));
      setInvoices(formattedInvoices);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors du chargement des factures"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleViewInvoice = (invoice: Invoice) => {
    navigate({ search: `?invoiceId=${invoice.id}` }, { replace: false });
  };

  const handleUploadSuccess = () => {
    setIsModalOpen(false);
    fetchInvoices();
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
        <h1 className="text-2xl font-bold text-gray-900">Mes factures</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Ajouter une facture
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter une facture"
      >
        <UploadInvoiceForm onSuccess={handleUploadSuccess} />
      </Modal>

      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore de factures.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    —
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.restaurant.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.supplier?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceDetailModal
        invoiceId={invoiceId}
        isOpen={Boolean(invoiceId)}
        onClose={() => navigate({ search: '' }, { replace: true })}
      />
    </div>
  );
}