type AIExtractedProduct = {
  label: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
};

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
  date: Date;
};

/**
 * Convertit les données extraites par l'IA en données de formulaire
 * en faisant correspondre les noms d'ingrédients avec la liste existante
 */
export function mapAIResponseToFormData(
  aiData: AIExtractedProduct[],
  ingredients: Ingredient[]
): ProductFormValue[] {
  return aiData.map(item => {
    // Recherche de l'ingrédient correspondant uniquement si ingredient_name existe
    const matchingIngredient = ingredients.find(ing => 
      item.ingredient_name && ing.name.toLowerCase() === item.ingredient_name.toLowerCase()
    );

    return {
      ingredient_id: matchingIngredient?.id || '',
      label: item.label,
      quantity: item.quantity || 0,
      unit: item.unit,
      price: item.price || 0,
      date: new Date()
    };
  });
}