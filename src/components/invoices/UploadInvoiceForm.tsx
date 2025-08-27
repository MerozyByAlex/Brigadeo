import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { InvoiceHeaderPayload } from '../../../shared/zod/invoice';

type Restaurant = {
  id: string;
  name: string;
};

type UploadInvoiceFormProps = {
  onSuccess?: (invoiceId: string, storagePath?: string) => void;
};

export default function UploadInvoiceForm({ onSuccess }: UploadInvoiceFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [supplier, setSupplier] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [restaurantError, setRestaurantError] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!profile.organization_id) {
          throw new Error('Aucune organisation trouvée');
        }

        const { data, error: fetchError } = await supabase
          .from('restaurant')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (fetchError) throw fetchError;
        setRestaurants(data || []);

        if (data && data.length === 1) {
          setRestaurantId(data[0].id);
        }
      } catch (err) {
        setError("Impossible de charger les restaurants");
        console.error(err);
      }
    };

    fetchRestaurants();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setFileError('Seuls les fichiers PDF sont acceptés');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB max
      setFileError('Le fichier ne doit pas dépasser 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFileError('');
    setRestaurantError('');
    setDateError('');

    if (!file) {
      setFileError('Veuillez sélectionner un fichier PDF');
      return;
    }

    if (!restaurantId) {
      setRestaurantError('Veuillez sélectionner un restaurant');
      return;
    }

    if (!date) {
      setDateError('Veuillez sélectionner une date');
      return;
    }

    setLoading(true);

    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error('Aucune organisation trouvée');
      }

      // Upload du fichier dans le bucket 'invoices'
      const filePath = `${profile.organization_id}/${new Date().getTime()}_${file.name}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      if (!uploadData?.path) throw new Error("Erreur lors de l'upload du fichier");

      // Création de l'entrée dans la table invoice
      const invoiceData = {
        organization_id: profile.organization_id,
        restaurant_id: restaurantId,
        storage_path: uploadData.path,
        invoice_date: new Date(date),
        supplier: supplier.trim() || null,
        status: 'imported' as const,
        currency: 'EUR' as const
      };

      // Validation avec le schéma Zod
      try {
        InvoiceHeaderPayload.parse(invoiceData);
      } catch (validationError) {
        console.error('Erreur de validation:', validationError);
        throw new Error('Données de facture invalides');
      }

      const { data: invoice, error: insertError } = await supabase
        .from('invoice')
        .insert([invoiceData])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!invoice) throw new Error("Erreur lors de la création de la facture");

      // Reset du formulaire
      setFile(null);
      setDate(new Date().toISOString().slice(0, 16));
      setSupplier('');
      if (restaurants.length > 1) {
        setRestaurantId('');
      }

      // Callback de succès
      if (onSuccess) {
        onSuccess(invoice.id, invoice.storage_path);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de l'upload de la facture"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6
          ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
          ${!loading && 'hover:border-blue-200 hover:bg-blue-50'}
          transition-colors duration-200
        `}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="invoice-file"
          disabled={loading}
        />
        <label
          htmlFor="invoice-file"
          className={`
            flex flex-col items-center justify-center gap-2 cursor-pointer
            ${loading && 'cursor-not-allowed'}
          `}
        >
          <Upload className={`h-8 w-8 ${file ? 'text-green-500' : 'text-gray-400'}`} />
          {file ? (
            <span className="text-sm text-green-600 font-medium">{file.name}</span>
          ) : (
            <>
              <span className="text-sm text-gray-600 font-medium">
                Cliquez ou déposez votre fichier PDF ici
              </span>
              <span className="text-xs text-gray-500">
                Taille maximale : 10MB
              </span>
            </>
          )}
        </label>
      </div>

      {fileError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {fileError}
        </p>
      )}

      {restaurants.length > 1 && (
        <FormField label="Restaurant" error={restaurantError} required>
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={loading}
          >
            <option value="">Sélectionner un restaurant...</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Date de la facture" error={dateError} required>
        <Input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Fournisseur">
        <Input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <Button
        type="submit"
        loading={loading}
        disabled={loading || !file}
        icon={<Upload className="h-4 w-4" />}
        fullWidth
      >
        Envoyer la facture
      </Button>

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