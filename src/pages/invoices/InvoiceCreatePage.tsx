import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';

type Restaurant = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

const PAYMENT_METHODS = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'wire', label: 'Virement' },
  { value: 'cash', label: 'Espèces' },
  { value: 'other', label: 'Autre' }
];

const STATUS_OPTIONS = [
  { value: 'imported', label: 'Importée' },
  { value: 'validated', label: 'Validée' },
  { value: 'error', label: 'Erreur' }
];

const toCents = (value: string): number => {
  const num = parseFloat(value || '0');
  return Math.round(num * 100);
};

const formatEuro = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 16));
  const [restaurantId, setRestaurantId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [subtotalExcl, setSubtotalExcl] = useState('');
  const [totalVat, setTotalVat] = useState('');
  const [totalIncl, setTotalIncl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [status, setStatus] = useState('imported');
  const [notes, setNotes] = useState('');
  
  // Data state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!profile.organization_id) {
          throw new Error("Aucune organisation trouvée");
        }

        // Charger les restaurants
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurant')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (restaurantsError) throw restaurantsError;

        // Charger les fournisseurs
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('supplier')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (suppliersError) throw suppliersError;

        setRestaurants(restaurantsData || []);
        setSuppliers(suppliersData || []);

        // Auto-sélectionner si un seul choix disponible
        if (restaurantsData && restaurantsData.length === 1) {
          setRestaurantId(restaurantsData[0].id);
        }
        if (suppliersData && suppliersData.length === 1) {
          setSupplierId(suppliersData[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des données"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = (): string | null => {
    if (!invoiceDate) {
      return 'La date de facture est obligatoire';
    }
    if (!restaurantId) {
      return 'Veuillez sélectionner un restaurant';
    }
    if (!supplierId) {
      return 'Veuillez sélectionner un fournisseur';
    }

    const subtotalCents = toCents(subtotalExcl);
    const vatCents = toCents(totalVat);
    const totalCents = toCents(totalIncl);

    if (subtotalCents < 0 || vatCents < 0 || totalCents < 0) {
      return 'Les montants doivent être positifs ou nuls';
    }

    // Vérification optionnelle de cohérence
    if (subtotalCents > 0 && vatCents > 0 && totalCents > 0) {
      if (Math.abs((subtotalCents + vatCents) - totalCents) > 1) { // tolérance d'1 centime
        return 'Incohérence détectée : Sous-total HT + TVA ≠ Total TTC';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const profile = await getCurrentProfile();

      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const invoiceData = {
        organization_id: profile.organization_id,
        restaurant_id: restaurantId,
        supplier_id: supplierId,
        invoice_number: invoiceNumber.trim() || null,
        invoice_date: invoiceDate,
        subtotal_excl_cents: toCents(subtotalExcl) || null,
        total_vat_cents: toCents(totalVat) || null,
        total_incl_cents: toCents(totalIncl) || null,
        payment_method: paymentMethod,
        status,
        notes: notes.trim() || null,
        currency: 'EUR',
        storage_path: `manual/${Date.now()}_manual_invoice.pdf` // Chemin fictif pour les factures manuelles
      };

      const { error: insertError } = await supabase
        .from('invoice')
        .insert([invoiceData]);

      if (insertError) throw insertError;

      showToast({
        text: 'Facture créée avec succès !',
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });

      navigate('/invoices');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la création de la facture"
      );
      console.error(err);
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatEuro = (cents: number | null): string => {
    if (cents === null) return '—';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(cents / 100);
  };

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/invoices')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section Informations générales */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Informations générales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Numéro de facture">
              <Input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Optionnel"
              />
            </FormField>

            <FormField label="Date de facture" required>
              <Input
                type="datetime-local"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Restaurant" required>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un restaurant...</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Fournisseur" required>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un fournisseur...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        {/* Section Montants */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Montants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Sous-total HT (€)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={subtotalExcl}
                onChange={(e) => setSubtotalExcl(e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="TVA (€)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalVat}
                onChange={(e) => setTotalVat(e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Total TTC (€)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalIncl}
                onChange={(e) => setTotalIncl(e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>

          {/* Vérification de cohérence */}
          {subtotalExcl && totalVat && totalIncl && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              Vérification : {formatEuro(toCents(subtotalExcl))} + {formatEuro(toCents(totalVat))} = {formatEuro(toCents(subtotalExcl) + toCents(totalVat))}
              {Math.abs((toCents(subtotalExcl) + toCents(totalVat)) - toCents(totalIncl)) > 1 && (
                <span className="text-red-600 ml-2">⚠️ Incohérence détectée</span>
              )}
            </div>
          )}
        </div>

        {/* Section Options */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Moyen de paiement">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Statut">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              placeholder="Notes optionnelles..."
            />
          </FormField>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/invoices')}
            disabled={submitting}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            icon={<Save className="h-4 w-4" />}
            className="flex-1"
          >
            Créer la facture
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
    </div>
  );
}