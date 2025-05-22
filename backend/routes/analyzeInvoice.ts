import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import FormData from 'form-data';
import { buildInvoicePrompt } from '../lib/openaiPrompts';
import fetch from 'node-fetch';

const router = Router();
const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = process.env;

if (!OPENAI_API_KEY || !OPENAI_ASSISTANT_ID) {
  throw new Error("Les variables d'environnement OPENAI_API_KEY et OPENAI_ASSISTANT_ID sont requises");
}

type AnalyzeInvoiceBody = {
  storagePath: string;
  organization_id: string;
};

const OPENAI_BASE = 'https://api.openai.com/v1';

const headers = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'OpenAI-Beta': 'assistants=v2',
};

router.post('/', async (req: Request<{}, {}, AnalyzeInvoiceBody>, res: Response) => {
  try {
    const { storagePath, organization_id } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: "L'identifiant de l'organisation est requis" });
    }
    if (!storagePath) return res.status(400).json({ error: 'Le chemin du fichier est requis' });

    // Récupération des ingrédients de l'organisation
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredient')
      .select('name')
      .eq('organization_id', organization_id);

    if (ingredientsError) {
      throw new Error("Impossible de récupérer la liste des ingrédients");
    }

    const ingredientNames = (ingredients || []).map(ing => ing.name);

    // 1. Récupération du PDF depuis Supabase
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(storagePath, 3600);
    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Impossible de générer l'URL du fichier");
    }

    const fileRes = await fetch(signedUrlData.signedUrl);
    if (!fileRes.ok) throw new Error(`Erreur de téléchargement PDF : ${fileRes.status}`);
    

// Tentative de compression du PDF
const fileBuffer = await fileRes.buffer(); // on garde cette ligne
const originalSizeKB = (fileBuffer.length / 1024).toFixed(2);

// Compression (pas de redéclaration ici !)
let compressedBuffer = fileBuffer;
try {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const compressedPdf = await pdfDoc.save({
    addDefaultPage: false,
  });
  compressedBuffer = Buffer.from(compressedPdf);
  const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
  console.log(`📦 Compression PDF réussie : ${originalSizeKB}KB → ${compressedSizeKB}KB`);
} catch (compressError) {
  console.warn('⚠️ Compression PDF échouée, envoi du fichier original:', compressError);
}


    // 2. Upload du fichier PDF à OpenAI
    const form = new FormData();
    form.append('file', compressedBuffer, {
      filename: path.basename(storagePath),
      contentType: 'application/pdf',
    });
    form.append('purpose', 'assistants');

    const fileUploadRes = await fetch(`${OPENAI_BASE}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const uploadedFile = await fileUploadRes.json();
    if (!fileUploadRes.ok) throw new Error(`Erreur upload fichier : ${JSON.stringify(uploadedFile)}`);

    // 3. Créer un vector store avec le fichier
    const vectorStoreRes = await fetch(`${OPENAI_BASE}/vector_stores`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `facture-${Date.now()}`,
        file_ids: [uploadedFile.id],
      }),
    });

    const vectorStore = await vectorStoreRes.json();
    if (!vectorStoreRes.ok) throw new Error(`Erreur vector store : ${JSON.stringify(vectorStore)}`);

    // 4. Créer un thread
    const threadRes = await fetch(`${OPENAI_BASE}/threads`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const thread = await threadRes.json();
    if (!threadRes.ok) throw new Error(`Erreur création thread : ${JSON.stringify(thread)}`);

    // 5. Ajouter un message au thread
    const messageRes = await fetch(`${OPENAI_BASE}/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: buildInvoicePrompt(ingredientNames)
      }),
    });

    const message = await messageRes.json();
    if (!messageRes.ok) throw new Error(`Erreur message thread : ${JSON.stringify(message)}`);

    // 6. Lancer le run
    const runRes = await fetch(`${OPENAI_BASE}/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: OPENAI_ASSISTANT_ID,
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStore.id],
          },
        },
      }),
    });

    const run = await runRes.json();
    if (!runRes.ok) throw new Error(`Erreur run : ${JSON.stringify(run)}`);

    // 7. Attente fin de traitement
    let status = 'queued';
    let attempts = 0;
    while (status !== 'completed' && status !== 'failed' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const runCheckRes = await fetch(`${OPENAI_BASE}/threads/${thread.id}/runs/${run.id}`, {
        method: 'GET',
        headers,
      });
      const runCheck = await runCheckRes.json();
      status = runCheck.status;
      attempts++;
    }

    if (status !== 'completed') {
      throw new Error("L'analyse n'a pas pu être complétée.");
    }

    // 8. Récupération des messages
    const messagesRes = await fetch(`${OPENAI_BASE}/threads/${thread.id}/messages`, {
      method: 'GET',
      headers,
    });

    const messages = await messagesRes.json();
    if (!messagesRes.ok) throw new Error(`Erreur récupération messages : ${JSON.stringify(messages)}`);

    const lastMessage = messages.data.find((m: any) => m.role === 'assistant');
    const content = lastMessage?.content?.find((c: any) => c.type === 'text')?.text?.value;

    res.json({
      analysis: content || 'Aucune analyse disponible',
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la facture :', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
});

export default router;
