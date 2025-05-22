import { useState } from 'react';
import { Search } from 'lucide-react';
import { Check } from 'lucide-react';
import Input from '../ui/Input';
import clsx from 'clsx';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

type RecipeIngredientSelectorProps = {
  ingredients: Ingredient[];
  usedIngredientIds: string[];
  onSelect: (ingredient: Ingredient) => void;
  onDeselect: (ingredientId: string) => void;
};

const UNIT_LABELS = {
  weight: 'Poids',
  volume: 'Volume',
  unit: 'Unité'
};

export default function RecipeIngredientSelector({
  ingredients,
  usedIngredientIds,
  onSelect,
  onDeselect
}: RecipeIngredientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer selon le terme de recherche
  const filteredIngredients = ingredients
    .filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = usedIngredientIds.includes(a.id);
      const bSelected = usedIngredientIds.includes(b.id);
      if (aSelected === bSelected) {
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      }
      return aSelected ? -1 : 1;
    }
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-3 border-b border-gray-200">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un ingrédient..."
          icon={<Search className="h-5 w-5" />}
        />
      </div>

      <div className="p-1 max-h-60 overflow-y-auto">
        {filteredIngredients.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Aucun ingrédient ne correspond à votre recherche
          </p>
        ) : (
          <div className="space-y-1">
            {filteredIngredients.map((ingredient) => {
              const isSelected = usedIngredientIds.includes(ingredient.id);
              return (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSelected) {
                      onDeselect(ingredient.id);
                    } else {
                      onSelect(ingredient);
                    }
                  }}
                  className={clsx(
                    'w-full px-3 py-2 text-left rounded-lg transition-colors flex justify-between items-center',
                    isSelected ? 'bg-blue-50 cursor-default' : 'hover:bg-blue-50',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                >
                  <div>
                    <span className="text-gray-900">{ingredient.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({UNIT_LABELS[ingredient.unit]})
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}