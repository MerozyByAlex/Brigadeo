import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useHasChanged } from '../../hooks/useHasChanged';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Save, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const UNIT_OPTIONS = [
  { value: 'weight', label: 'Poids (en grammes)' },
  { value: 'volume', label: 'Volume (en millilitres)' },
  { value: 'unit', label: 'Unité (par pièce)' }
];

type IngredientFormProps = {
  initialData?: {
    id: string;
    name: string;
    unit: 'weight' | 'volume' | 'unit';
  };
  onSuccess: () => void;
};

export default function IngredientForm({ initialData, onSuccess }: IngredientFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [unit, setUnit] = useState(initialData?.unit ?? 'weight');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [nameError, setNameError] = useState('');
  const hasChanged = useHasChanged(
    { name: initialData?.name, unit: initialData?.unit },
    { name: name.trim(), unit }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setNameError('');

    const trimmedName = name.trim();

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

      let error;
      
      if (initialData) {
        ({ error } = await supabase
          .from('ingredient')
          .update({ name: trimmedName, unit })
          .eq('id', initialData.id)
          .eq('organization_id', profile.organization_id));
      } else {
        ({ error } = await supabase
          .from('ingredient')
          .insert([{
            name: trimmedName,
            unit,
            organization_id: profile.organization_id
          }]));
      }

      if (error) throw error;

      if (!initialData) {
        setName('');
        setUnit('weight');
      }
      onSuccess();
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : `Une erreur s'est produite lors de la ${initialData ? 'modification' : 'création'} de l'ingrédient`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      return;
    }

    setLoading(true);
    setGlobalError('');

    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { error } = await supabase
        .from('ingredient')
        .delete()
        .eq('id', initialData.id)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      onSuccess();
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la suppression de l'ingrédient"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nom de l'ingrédient" error={nameError} required>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Type de mesure" required>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {UNIT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex gap-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          icon={initialData && <Save className="h-4 w-4" />}
          className={clsx(
            'transition-all duration-300 ease-in-out',
            initialData && {
              'w-1/2': !hasChanged,
              'w-3/4': hasChanged
            },
            !initialData && 'w-full'
          )}
        >
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>
        
        {initialData && (
          <Button
            type="button"
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            disabled={loading}
            className={clsx(
              'transition-all duration-300 ease-in-out',
              'w-1/2',
              hasChanged && 'w-1/4'
            )}
          >
            Supprimer
          </Button>
        )}
      </div>

      {globalError && (
        <div
          className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm"
          role="alert"
        >
          {globalError}
        </div>
      )}
    </form>
  );
}