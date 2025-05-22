export function buildInvoicePrompt(ingredientNames: string[]): string {
  const list = ingredientNames.map(name => `- ${name}`).join('\n');

  return `Tu es un assistant intégré dans l'application Brigadéo, utilisée par des restaurateurs pour suivre leurs achats.

Tu vas analyser une facture fournisseur au format PDF. Ton objectif est d'extraire une liste de produits achetés, même si certains ne correspondent pas à un ingrédient connu.

Voici la liste des ingrédients autorisés dans le système :
${list}

Pour chaque produit identifié sur la facture, retourne un objet JSON avec les champs suivants :
- "label" : le libellé complet tel qu'il apparaît sur la facture
- "ingredient_name" : un des noms de la liste ci-dessus s’il correspond, ou null sinon
- "quantity" : la quantité (numérique), ou null si inconnue
- "unit" : l’unité de mesure (ex: "g", "kg", "L", "unit"), ou null si inconnue
- "price" : le prix total en euros (nombre), ou null si inconnu

Contraintes :
- Tu dois retourner tous les produits identifiés, même s'ils ne matchent aucun ingrédient.
- Ne fais aucune supposition : si une information est absente ou incertaine, mets null.
- Ne retourne aucun texte, aucune explication ni aucune mise en forme Markdown.
- Répond uniquement avec un tableau JSON strictement valide.`;
}
