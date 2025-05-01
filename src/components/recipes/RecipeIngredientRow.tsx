import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';

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
  showLabels?: boolean;
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
  showLabels = false
}: RecipeIngredientRowProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(
    ingredients.find(i => i.id === value.ingredient_id)
  );

  useEffect(() => {
    setSelectedIngredient(ingredients.find(i => i.id === value.ingredient_id));
  }, [value.ingredient_id, ingredients]);

  return (
    <div className="grid grid-cols-12 gap-4 items-end">
      <div className="col-span-5">
        <FormField 
          label={showLabels ? "Ingrédient" : undefined}
          required={showLabels}
        >
          <select
            value={value.ingredient_id}
            onChange={(e) => onChange({ ...value, ingredient_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sélectionner...</option>
            {ingredients.map(ingredient => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="col-span-5">
        <FormField 
          label={showLabels ? "Quantité" : undefined}
          required={showLabels}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="any"
              value={value.quantity}
              onChange={(e) => onChange({ 
                ...value,
                quantity: parseFloat(e.target.value) || 0
              })}
            />
            {selectedIngredient && (
              <span className="text-gray-500 whitespace-nowrap">
                {UNIT_LABELS[selectedIngredient.unit]}
              </span>
            )}
          </div>
        </FormField>
      </div>

      <div className="col-span-2">
        <Button
          variant="danger"
          onClick={onDelete}
          icon={<Trash2 className="h-4 w-4" />}
          className="w-full"
        />
      </div>
    </div>
  );
}