import { useState, useEffect } from 'react';
import { CheckCircle, X, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useToast } from '../../hooks/useToast';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';

type SupplierFormProps = {
  supplier?: {
    id: string;
    name: string;
    siret?: string | null;
    vat_number?: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
};

export default function SupplierForm({ supplier, onClose, onSaved }: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name ?? '');
  const [siret, setSiret] = useState(supplier?.siret ?? '');
  const [isForeign, setIsForeign] = useState(Boolean(supplier?.vat_number));
  const [vatNumber, setVatNumber] = useState(supplier?.vat_number ?? '');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const showToast = useToast();

  // Focus automatique sur le champ nom à l'ouverture
  useEffect(() => {
    const timer = setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement | null;
      nameInput?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');

    const trimmedName = name.trim();
    const trimmedSiret = siret.trim() || null;
    const trimmedVatNumber = isForeign && vatNumber.trim() ? vatNumber.trim() : null;

    if (trimmedName.length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    setLoading(true);

    try {
      const profile = await getCurrentProfile();
      if (!profile.organization_id) {
        throw new Error('Aucune organisation trouvée');
      }

      let dbError;

      if (supplier) {
        // Mise à jour
        ({ error: dbError } = await supabase
          .from('supplier')
          .update({
            name: trimmedName,
            siret: trimmedSiret,
            vat_number: trimmedVatNumber,
          })
          .eq('id', supplier.id));
      } else {
        // Création
        ({ error: dbError } = await supabase
          .from('supplier')
          .insert([{
            organization_id: profile.organization_id,
            name: trimmedName,
            siret: trimmedSiret,
            vat_number: trimmedVatNumber,
          }])
          .select('id')
          .single());
      }

      if (dbError) throw dbError;

      showToast({
        text: supplier ? 'Fournisseur mis à jour avec succès !' : 'Fournisseur créé avec succès !',
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Une erreur s'est produite lors de la ${supplier ? 'modification' : 'création'} du fournisseur`
      );
      console.error(err);
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="Nom du fournisseur" error={nameError}>
        <Input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du fournisseur"
          required
        />
      </FormField>

      <FormField label="SIRET">
        <Input
          type="text"
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          placeholder="Numéro SIRET (optionnel)"
        />
      </FormField>

      <FormField>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isForeign"
            checked={isForeign}
            onChange={(e) => setIsForeign(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isForeign" className="text-sm font-medium text-gray-700">
            Fournisseur à l'étranger
          </label>
        </div>
      </FormField>

      {isForeign && (
        <FormField label="N° TVA intracommunautaire">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Ex: FR12345678901"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <HelpCircle
                  className="h-4 w-4 text-gray-400"
                  title="Le numéro de TVA officiel de ton fournisseur dans l'UE (ex : FR…)."
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Si hors UE, laisse vide.</p>
          </div>
        </FormField>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !name.trim()}
          className="flex-1"
        >
          {supplier ? 'Mettre à jour' : 'Enregistrer'}
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
  );
}
