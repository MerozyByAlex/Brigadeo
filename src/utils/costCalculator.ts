// src/utils/costCalculator.ts

export const calculateCost = (
  price_cents: number,  // Prix total du produit (en centimes)
  purchase_quantity: number,  // Quantité achetée du produit
  unit: 'weight' | 'volume' | 'unit',  // Unité d'achat : 'weight', 'volume', 'unit'
  desired_quantity: number  // Quantité souhaitée pour le calcul (par exemple, 1kg, 1000g)
) => {
  // Cas pour l'unité 'weight' (poids)
  if (unit === 'weight') {
    // Le poids est toujours enregistré en grammes
    return (price_cents * desired_quantity) / purchase_quantity;
  }

  // Cas pour l'unité 'volume' (volume)
  if (unit === 'volume') {
    // Le volume est toujours enregistré en litres
    return (price_cents * desired_quantity) / purchase_quantity;
  }

  // Cas pour l'unité 'unit' (unités indivisibles)
  if (unit === 'unit') {
    return (price_cents * desired_quantity) / purchase_quantity;
  }

  // Retourner 0 si l'unité n'est pas reconnue
  return 0;
};
