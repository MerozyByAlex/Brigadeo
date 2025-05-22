import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import FormField from '../ui/FormField';
import Input from '../ui/Input';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

type RecipeIngredientRowProps = {
  value: {
    ingredient_id: string;
    quantity: number;
  };
  ingredients: Ingredient[];
  onChange: (value: { ingredient_id: string; quantity: number }) => void;
  onDelete: () => void;
  highlighted?: boolean;
  showLabels?: boolean; // 👈 ajouté ici
};

const UNIT_LABELS = {
  weight: 'grammes',
  volume: 'millilitres',
  unit: 'unité(s)'
};

export default function RecipeIngredientRow({
  value,
  ingredients,
  onChange,
  onDelete,
  highlighted = false,
  showLabels = false
}: RecipeIngredientRowProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(
    ingredients.find(i => i.id === value.ingredient_id)
  );

  useEffect(() => {
    setSelectedIngredient(ingredients.find(i => i.id === value.ingredient_id));
  }, [value.ingredient_id, ingredients]);

  return (
    <div className="grid grid-cols-[1fr_200px_40px] items-center gap-x-4">
      {showLabels && <FormField label="Ingrédient">
        <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm text-sm text-gray-700">
          {selectedIngredient?.name || <span className="italic text-gray-400">Ingrédient inconnu</span>}
        </div>
      </FormField>}
      {!showLabels && (
        <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm text-sm text-gray-700">
          {selectedIngredient?.name || <span className="italic text-gray-400">Ingrédient inconnu</span>}
        </div>
      )}

      {showLabels && <FormField label="Quantité">
        <div className="flex items-center gap-2">
          <Input
            label="Quantité"
            type="number"
            min="0"
            step="any"
            value={value.quantity || ''}
            className={clsx(
              'transition-all duration-300',
              highlighted && 'ring-2 ring-red-500 border-red-500 animate-pulse'
            )}
            onChange={(e) => onChange({ 
              ...value,
              quantity: parseFloat(e.target.value) || 0
            })}
          />
          {selectedIngredient && (
            <span className="whitespace-nowrap text-sm text-gray-500">
              {UNIT_LABELS[selectedIngredient.unit]}
            </span>
          )}
        </div>
      </FormField>}
      {!showLabels && (
        <div className="flex items-center gap-2">
          <Input
            label="Quantité"
            type="number"
            min="0"
            step="any"
            value={value.quantity || ''}
            className={clsx(
              'transition-all duration-300',
              highlighted && 'ring-2 ring-red-500 border-red-500 animate-pulse'
            )}
            onChange={(e) => onChange({ 
              ...value,
              quantity: parseFloat(e.target.value) || 0
            })}
          />
          {selectedIngredient && (
            <span className="whitespace-nowrap text-sm text-gray-500">
              {UNIT_LABELS[selectedIngredient.unit]}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 transition-colors flex items-center justify-center h-8 w-8 mt-6"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}