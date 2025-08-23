import { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { formatDate } from '../../utils/date';
import clsx from 'clsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import UploadInvoiceForm from './UploadInvoiceForm';

type Invoice = {
  id: string;
  invoice_date: string;
  storage_path: string;
  supplier: string | null;
  restaurant: {
    name: string;
  } | null;
};

type SelectInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (storagePath: string) => void;
};

export default function SelectInvoiceModal({ isOpen, onClose, onSelect }: SelectInvoiceModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'upload'>('list');
  const [searchTerm, setSearchTerm] = useState('');

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
          supplier,
          restaurant:restaurant_id!inner (
            name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('invoice_date', { ascending: false });

      if (fetchError) throw fetchError;

      const cleanedData = (data || []).map((invoice: any) => ({
        ...invoice,
        restaurant: Array.isArray(invoice.restaurant)
          ? invoice.restaurant[0] || null
          : invoice.restaurant,
      })) as Invoice[];

      setInvoices(cleanedData);
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
    if (isOpen) {
      fetchInvoices();
    }
  }, [isOpen]);

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getFileName(invoice.storage_path).toLowerCase().includes(searchLower) ||
      (invoice.restaurant?.name || '').toLowerCase().includes(searchLower) ||
      (invoice.supplier && invoice.supplier.toLowerCase().includes(searchLower))
    );
  });

  const handleUploadSuccess = (storagePath: string) => {
    onSelect(storagePath);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sélectionner une facture"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            onClick={() => setView('list')}
            className={clsx('flex-1', view === 'list' && 'pointer-events-none')}
          >
            Utiliser une facture existante
          </Button>
          <Button
            variant={view === 'upload' ? 'primary' : 'outline'}
            onClick={() => setView('upload')}
            className={clsx('flex-1', view === 'upload' && 'pointer-events-none')}
          >
            Ajouter une nouvelle facture
          </Button>
        </div>

        {view === 'list' && (
          <>
            <div className="mb-4">
              <Input
                type="text"
                label="Rechercher une facture"
                icon={<Search className="h-5 w-5" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : error ? (
              <div className="p-4 rounded bg-red-50 border border-red-200 text-red-600">
                {error}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {invoices.length === 0
                  ? 'Aucune facture disponible'
                  : 'Aucune facture ne correspond à votre recherche'}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[60vh] space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-white rounded-lg shadow p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {getFileName(invoice.storage_path)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Restaurant : {invoice.restaurant?.name || '—'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Date : {formatDate(invoice.invoice_date)}
                        </p>
                        {invoice.supplier && (
                          <p className="text-sm text-gray-500">
                            Fournisseur : {invoice.supplier}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(invoice.storage_path)}
                        className="flex-shrink-0"
                      >
                        Utiliser cette facture
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'upload' && (
          <div>
            <UploadInvoiceForm onSuccess={handleUploadSuccess} />
          </div>
        )}
      </div>
    </Modal>
  );
}
