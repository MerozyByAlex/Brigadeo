import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('La variable d\'environnement OPENAI_API_KEY est requise');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ❌ Fonction désactivée : remplacée par l'API Assistant d'OpenAI
/*
export async function analyzeWithOpenAI(invoiceLines: string[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          "Tu es un assistant expert en restauration, spécialisé dans l'analyse de factures de fournisseurs. Tu dois identifier les ingrédients mentionnés dans les lignes de facture qui te sont fournies.",
      },
      {
        role: 'user',
        content: `Voici des lignes issues d'une facture :\n${invoiceLines.join('\n')}\n\nIdentifie les ingrédients associés.`,
      },
    ],
  });

  return response.choices[0].message.content || '';
}
*/

// ❌ Fonction désactivée : remplacée par l'API Assistant d'OpenAI
/*
export async function analyzePdfWithOpenAI(filePath: string): Promise<string> {
  try {
    const file = fs.createReadStream(filePath);
    const uploadResponse = await openai.files.create({
      file,
      purpose: 'assistants',
    });

    const response = await openai.beta.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            "Tu es un assistant expert en restauration, spécialisé dans l'analyse de factures fournisseurs.",
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Ce fichier est une facture fournisseur. Liste tous les ingrédients achetés qui y sont mentionnés.',
            },
            {
              type: 'file',
              file_id: uploadResponse.id,
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error("Erreur lors de l'analyse du PDF:", error);
    throw error;
  }
}
*/
