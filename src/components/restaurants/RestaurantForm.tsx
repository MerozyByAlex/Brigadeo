import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { useToast } from '../../hooks/useToast';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Trash2, Save } from 'lucide-react';
import { useHasChanged } from '../../hooks/useHasChanged';
import clsx from 'clsx';

type RestaurantFormProps = {
  initialData?: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
};

export default function RestaurantForm({ initialData, onSuccess }: RestaurantFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [nameError, setNameError] = useState('');
  const showToast = useToast();
  const hasChanged = useHasChanged(initialData?.name, name.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setNameError('');

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      setNameError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    setLoading(true);

    try {
      const profile = await getCurrentProfile();
      
      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      let error;
      
      if (initialData) {
        ({ error } = await supabase
          .from('restaurant')
          .update({ name: trimmedName })
          .eq('id', initialData.id)
          .eq('organization_id', profile.organization_id));
      } else {
        ({ error } = await supabase
          .from('restaurant')
          .insert([{ 
            name: trimmedName, 
            organization_id: profile.organization_id 
          }]));
      }

      if (error) throw error;

      showToast({
        text: initialData
          ? "Restaurant mis à jour avec succès !"
          : "Restaurant créé avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });

      if (!initialData) {
        setName('');
      }
      onSuccess();
      return;
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : `Une erreur s'est produite lors de la ${initialData ? 'modification' : 'création'} du restaurant`
      );
      console.error(err);
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ?')) {
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
        .from('restaurant')
        .delete()
        .eq('id', initialData.id)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      showToast({
        text: "Restaurant supprimé avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });

      onSuccess();
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la suppression du restaurant"
      );
      console.error(err);
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nom du restaurant" error={nameError} required>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
