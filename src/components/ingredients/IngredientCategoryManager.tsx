import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';
import { Input } from '../ui/Input';


type Category = {
  id: string;
  name: string;
  organization_id: string | null;
};

type IngredientCategoryManagerProps = {
  tableName: string;
  selectedId: string | null;
  onChange: (id: string) => void;
  organizationId: string;
  maxVisible?: number;
};

export default function IngredientCategoryManager({
  tableName,
  selectedId,
  onChange,
  organizationId,
  maxVisible
}: IngredientCategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id, name, organization_id')
          .or(`organization_id.eq.${organizationId},organization_id.is.null`)
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des catégories"
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

    fetchCategories();
  }, [tableName, organizationId]);

  const handleCreate = async () => {
    const trimmedName = searchTerm.trim();
    
    // Vérification du nom en doublon (insensible à la casse)
    const exists = categories.some(
      cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (exists) {
      setError('Une catégorie avec ce nom existe déjà');
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          name: trimmedName,
          organization_id: organizationId
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Aucune donnée retournée');

      // Ajout de la nouvelle catégorie et tri alphabétique
      const newCategories = [...categories, data].sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      setCategories(newCategories);
      onChange(data.id);
      setSearchTerm('');
      showToast({
        text: "Catégorie créée avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la création de la catégorie"
      );
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    setEditingId(id);
    setEditingName(category.name);
    setError(null);
  };

  const handleSaveEdit = async () => {
    const trimmedName = editingName.trim();
    
    if (!editingId) return;
    
    // Vérification du nom en doublon (insensible à la casse)
    const exists = categories.some(
      cat => cat.id !== editingId && 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (exists) {
      setError('Une catégorie avec ce nom existe déjà');
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ name: trimmedName })
        .eq('id', editingId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Mise à jour locale et tri
      const updatedCategories = categories.map(cat =>
        cat.id === editingId ? { ...cat, name: trimmedName } : cat
      ).sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      
      setCategories(updatedCategories);
      setEditingId(null);
      setEditingName('');
      showToast({
        text: "Catégorie modifiée avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la modification de la catégorie"
      );
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Mise à jour locale
      setCategories(categories.filter(cat => cat.id !== id));
      setEditingId(null);
      setEditingName('');

      // Si la catégorie supprimée était sélectionnée, on désélectionne
      if (selectedId === id) {
        onChange('');
      }
      showToast({
        text: "Catégorie supprimée avec succès !",
        color: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la suppression de la catégorie"
      );
      showToast({
        text: "Quelque chose s'est mal passé",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
      console.error(err);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Chargement...</div>;
  }

  const filteredCategories = categories.filter(category =>
    category.id !== selectedId && // Exclure la catégorie sélectionnée du filtre
    category.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const showCreateOption = searchTerm.trim().length > 0 && 
    !filteredCategories.some(
      cat => cat.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );

  if (error) {
    return (
      <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  // Récupérer la catégorie sélectionnée
  const selectedCategory = selectedId ? categories.find(c => c.id === selectedId) : null;

  // Créer la liste finale avec la catégorie sélectionnée en premier
  const finalCategories = selectedCategory
    ? [selectedCategory, ...filteredCategories]
    : filteredCategories;

  // Appliquer la limite si maxVisible est défini
  const visibleCategories = maxVisible
    ? finalCategories.slice(0, maxVisible)
    : finalCategories;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <Input
        ref={searchInputRef}
        type="text"
        label="Recherche"
        placeholder="Rechercher une catégorie"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        icon={<Search className="h-5 w-5" />}
        rightIcon={searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      />

      {filteredCategories.length === 0 && !showCreateOption && (
        <div className="text-center text-gray-500 py-4">
          Aucune catégorie ne correspond à votre recherche
        </div>
      )}

      <div className="space-y-1">
        {showCreateOption && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className={clsx(
              'w-full px-3 py-1.5 text-left rounded-lg transition-colors',
              'border-2 border-dashed border-gray-300',
              'hover:border-blue-300 hover:bg-blue-50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              creating && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center text-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              <span>
                {creating ? 'Création...' : `Créer "${searchTerm.trim()}"`}
              </span>
            </div>
          </button>
        )}

        {visibleCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => editingId !== category.id && onChange(category.id)}
            className={clsx(
              'w-full px-3 py-1.5 rounded-lg transition-colors',
              'flex items-center justify-between',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
              selectedId === category.id
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'border-2 border-transparent',
              category.organization_id === null && 'italic'
            )}
          >
            {editingId === category.id ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    label="Nom de la catégorie"
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category.id);
                  }}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-left">
                  <span className="text-gray-900">{category.name}</span>
                  {category.organization_id === null && (
                    <span className="ml-2 text-sm text-gray-500">(Globale)</span>
                  )}
                </div>
                {category.organization_id !== null && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}