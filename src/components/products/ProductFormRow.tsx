import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import FormField from '../ui/FormField';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

type Ingredient = {
  id: string;
  name: string;
  unit: 'weight' | 'volume' | 'unit';
};

type ProductFormValue = {
  ingredient_id: string;
  label?: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
};

type ProductFormRowProps = {
  value: ProductFormValue;
  ingredients: Ingredient[];
  onChange: (value: ProductFormValue) => void;
  onDelete?: () => void;
  showLabels?: boolean;
};

const UNIT_OPTIONS = {
  weight: [
    { value: 'kg', label: 'Kilogrammes (kg)', factor: 1000 },
    { value: 'g', label: 'Grammes (g)', factor: 1 },
    { value: 'mg', label: 'Milligrammes (mg)', factor: 0.001 }
  ],
  volume: [
    { value: 'L', label: 'Litres (L)', factor: 1000 },
    { value: 'ml', label: 'Millilitres (ml)', factor: 1 }
  ],
  unit: [
    { value: 'piece', label: 'Pièce', factor: 1 },
    { value: 'dizaine', label: 'Dizaine', factor: 10 },
    { value: 'douzaine', label: 'Douzaine', factor: 12 },
    { value: 'centaine', label: 'Centaine', factor: 100 }
  ]
};

export default function ProductFormRow({
  value,
  ingredients,
  onChange,
  onDelete,
  showLabels = false
}: ProductFormRowProps) {
  const [unitOptions, setUnitOptions] = useState<typeof UNIT_OPTIONS.weight>([]);

  const selectedIngredient = ingredients.find(i => i.id === value.ingredient_id);

  useEffect(() => {
    if (selectedIngredient) {
      const options = UNIT_OPTIONS[selectedIngredient.unit];
      setUnitOptions(options);

      // Si l’unité actuelle n’est pas dans les options, on en met une par défaut
      const currentValid = options.find(opt => opt.value === value.unit);
      if (!currentValid) {
        onChange({
          ...value,
          unit: options[0].value
        });
      }
    }
  }, [selectedIngredient]);

  const handleChange = (field: keyof ProductFormValue, newValue: string | number) => {
    if (field === 'quantity') {
      onChange({
        ...value,
        quantity: typeof newValue === 'string' ? parseFloat(newValue || '0') : newValue
      });
    } else {
      onChange({
        ...value,
        [field]: newValue
      });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-end">
      <div className="col-span-3">
        <FormField label={showLabels ? "Ingrédient" : undefined} required={showLabels}>
          <select
            value={value.ingredient_id}
            onChange={(e) => handleChange('ingredient_id', e.target.value)}
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

      <div className="col-span-2">
        <FormField label={showLabels ? "Libellé" : undefined}>
          <Input
            label="Libellé"
            type="text"
            value={value.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </FormField>
      </div>

      <div className="col-span-2">
        <FormField label={showLabels ? "Quantité" : undefined} required={showLabels}>
          <Input
            label="Quantité"
            type="number"
            min="0"
            step="any"
            value={value.quantity}
            onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
          />
        </FormField>
      </div>

      <div className="col-span-1">
        <FormField label={showLabels ? "Unité" : undefined} required={showLabels}>
          <select
            value={value.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            disabled={!selectedIngredient}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {selectedIngredient &&
              unitOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
          </select>
        </FormField>
      </div>

      <div className="col-span-2">
        <FormField label={showLabels ? "Prix (€)" : undefined} required={showLabels}>
          <Input
            label="Prix"
            type="number"
            min="0"
            step="0.01"
            value={value.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
          />
        </FormField>
      </div>

      <div className="col-span-1">
        <FormField label={showLabels ? "Date" : undefined} required={showLabels}>
          <Input
            label="Date"
            type="datetime-local"
            value={value.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </FormField>
      </div>

      {onDelete && (
        <div className={`col-span-1 ${showLabels ? 'pt-7' : ''}`}>
          <Button
            variant="danger"
            onClick={onDelete}
            icon={<Trash2 className="h-4 w-4" />}
            className="w-full h-[38px]"
          />
        </div>
      )}
    </div>
  );
}
