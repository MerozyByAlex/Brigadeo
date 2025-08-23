import { useState, useEffect, useRef } from 'react';
import { getInvoiceById, getInvoiceLines, type InvoiceHeader, type InvoiceLine } from '../../services/invoice';
import { formatDate } from '../../utils/date';
import Modal from '../ui/Modal';

type InvoiceDetailModalProps = {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
};

const formatEuro = (cents: number | null): string => {
  if (cents === null) return '—';
  return (cents / 100).toFixed(2) + ' €';
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

export default function InvoiceDetailModal({ invoiceId, isOpen, onClose }: InvoiceDetailModalProps) {
  const [header, setHeader] = useState<InvoiceHeader | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loadingHeader, setLoadingHeader] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorLines, setErrorLines] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Charger les données de la facture quand invoiceId change
  useEffect(() => {
    if (!invoiceId) return;

    const fetchHeader = async () => {
      setLoadingHeader(true);
      setErrorHeader(null);
      try {
        const data = await getInvoiceById(invoiceId);
        setHeader(data);
      } catch (err) {
        setErrorHeader(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement de la facture"
        );
        console.error(err);
      } finally {
        setLoadingHeader(false);
      }
    };

    fetchHeader();
  }, [invoiceId]);

  // Charger les lignes quand le modal s'ouvre
  useEffect(() => {
    if (!isOpen || !invoiceId) return;

    const fetchLines = async () => {
      setLoadingLines(true);
      setErrorLines(null);
      try {
        const data = await getInvoiceLines(invoiceId);
        setLines(data);
      } catch (err) {
        setErrorLines(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des lignes de facture"
        );
        console.error(err);
      } finally {
        setLoadingLines(false);
      }
    };

    fetchLines();
  }, [isOpen, invoiceId]);

  // Focus sur le bouton de fermeture à l'ouverture
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!invoiceId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails de la facture"
      size="lg"
    >
      <div className="space-y-6">
        {/* En-tête de la facture */}
        {loadingHeader ? (
          <div className="text-center py-4">Chargement de la facture...</div>
        ) : errorHeader ? (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-600">
            {errorHeader}
          </div>
        ) : header ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {header.invoice_number || 'Sans numéro'}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(header.status)}`}>
                {getStatusLabel(header.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(header.invoice_date)}</p>
              </div>
              <div>
                <p className="text-gray-500">Fournisseur</p>
                <p className="font-medium text-gray-900">{header.supplier?.name || '—'}</p>
              </div>
            </div>

            {/* Totaux */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total HT :</span>
                <span className="font-medium">{formatEuro(header.subtotal_excl_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA :</span>
                <span className="font-medium">{formatEuro(header.total_vat_cents)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span className="text-gray-900">Total TTC :</span>
                <span className="text-gray-900">{formatEuro(header.total_incl_cents)}</span>
              </div>
              {header.meta_rounding_diff_cents !== null && header.meta_rounding_diff_cents !== 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Écart d'arrondi :</span>
                  <span>{formatEuro(header.meta_rounding_diff_cents)}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Lignes de la facture */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Lignes de facture</h4>
          
          {loadingLines ? (
            <div className="text-center py-4">Chargement des lignes...</div>
          ) : errorLines ? (
            <div className="p-4 rounded bg-red-50 border border-red-200 text-red-600">
              {errorLines}
            </div>
          ) : lines.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Aucune ligne de facture
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PU HT
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total HT
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TVA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {line.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatEuro(line.unit_price_excl_cents)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatEuro(line.total_excl_cents)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatEuro(line.total_vat_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="flex justify-end pt-4">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}