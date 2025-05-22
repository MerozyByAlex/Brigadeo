import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = process.env;

if (!OPENAI_API_KEY) {
  throw new Error('La variable d\'environnement OPENAI_API_KEY est requise');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function createBrigadeoAssistant(): Promise<string> {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Brigadéo Analyzer",
      instructions: "Tu es un assistant spécialisé en restauration. À partir de factures fournisseurs, tu dois identifier les ingrédients achetés. Ignore les quantités, prix ou marques. Concentre-toi uniquement sur les noms d'ingrédients standardisés.",
      model: "gpt-4-1106-preview",
      tools: [{ type: "file_search" }]
    });

    return assistant.id;
  } catch (error) {
    console.error("Erreur lors de la création de l'assistant:", error);
    throw error;
  }
}

export async function updateBrigadeoAssistant(newInstructions: string): Promise<void> {
  if (!OPENAI_ASSISTANT_ID) {
    throw new Error('La variable d\'environnement OPENAI_ASSISTANT_ID est requise');
  }

  try {
    await openai.beta.assistants.update(
      OPENAI_ASSISTANT_ID,
      {
        instructions: newInstructions,
        model: "gpt-4-1106-preview",
        tools: [{ type: "file_search" }]
      }
    );

    console.log('✅ Assistant Brigadéo mis à jour avec succès');
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'assistant:", error);
    throw error;
  }
}

export async function getBrigadeoAssistantInstructions(): Promise<string> {
  if (!OPENAI_ASSISTANT_ID) {
    throw new Error('La variable d\'environnement OPENAI_ASSISTANT_ID est requise');
  }

  try {
    const assistant = await openai.beta.assistants.retrieve(OPENAI_ASSISTANT_ID);
    console.log('✅ Instructions de l\'assistant récupérées avec succès');
    return assistant.instructions || '';
  } catch (error) {
    console.error("Erreur lors de la récupération des instructions:", error);
    throw error;
  }
}