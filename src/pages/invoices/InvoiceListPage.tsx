import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { formatDate } from '../../utils/date';
import Button from '../../components/ui/Button';
import InvoiceDetailModal from '../../components/invoices/InvoiceDetailModal';
import InvoiceCreateModal from '../../components/invoices/InvoiceCreateModal';
import type { InvoiceHeaderWithRelations } from '../../types/invoice';

type InvoiceForList = InvoiceHeaderWithRelations & {
  id: string;
  supplierName?: string;
};

type Supplier = {
  id: string;
  name: string;
};

const formatEuro = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'imported':
      return 'Importée';
    case 'validated':
      return 'Validée';
    case 'error':
      return 'Erreur';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'imported':
      return 'bg-blue-100 text-blue-800';
    case 'validated':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function InvoiceListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [invoices, setInvoices] = useState<InvoiceForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchInvoices = async () => {
    try {
      const profile = await getCurrentProfile();

      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      // 1. Récupérer les factures
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoice')
        .select('id, invoice_number, invoice_date, supplier_id, total_incl_cents, status')
        .eq('organization_id', profile.organization_id)
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      const invoices = invoicesData || [];

      // 2. Extraire les supplier_id uniques
      const supplierIds = [...new Set(
        invoices
          .map(invoice => invoice.supplier_id)
          .filter(Boolean)
      )] as string[];

      // 3. Récupérer les fournisseurs
      let supplierMap: Record<string, string> = {};
      if (supplierIds.length > 0) {
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('supplier')
          .select('id, name')
          .in('id', supplierIds);

        if (suppliersError) throw suppliersError;

        supplierMap = (suppliersData || []).reduce((acc: Record<string, string>, supplier: Supplier) => {
          acc[supplier.id] = supplier.name;
          return acc;
        }, {});
      }

      // 4. Enrichir les factures avec le nom du fournisseur
      const enrichedInvoices = invoices.map(invoice => ({
        ...invoice,
        supplierName: invoice.supplier_id ? supplierMap[invoice.supplier_id] : undefined
      })) as InvoiceForList[];

      setInvoices(enrichedInvoices);
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

  const openDetail = (id: string) => {
    setSearchParams({ invoiceId: id });
  };

  const closeDetail = () => {
    setSearchParams({});
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
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Ajouter une facture
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n'avez pas encore de factures.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total TTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => invoice.id && openDetail(invoice.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.invoice_number || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.supplierName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatEuro(invoice.total_incl_cents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        invoice.id && openDetail(invoice.id);
                      }}
                      icon={<Eye className="h-4 w-4" />}
                    >
                      Voir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceCreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchInvoices}
      />

      <InvoiceDetailModal
        invoiceId={invoiceId ?? ''}
        isOpen={Boolean(invoiceId)}
        onClose={closeDetail}
      />
    </div>
  );
}