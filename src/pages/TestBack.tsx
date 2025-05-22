import { useState, useEffect } from 'react';
import { postToBackend } from '../services/backend';
import { supabase } from '../lib/supabase';
import { getCurrentProfile } from '../utils/auth';

export default function TestBack() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState<{ name: string; fullPath: string }[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const profile = await getCurrentProfile();
        const orgId = profile.organization_id;

        if (!orgId) {
          throw new Error("Aucune organisation trouvée");
        }

        const { data, error } = await supabase.storage
          .from('invoices')
          .list(orgId); // ✅ liste les fichiers dans le bon dossier

        if (error) throw error;

        const pdfFiles = (data || [])
          .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
          .map((file) => ({
            name: file.name,
            fullPath: `${orgId}/${file.name}`
          }));

        setFiles(pdfFiles);

        if (pdfFiles.length > 0) {
          setSelectedPath(pdfFiles[0].fullPath); // ✅ on stocke le chemin complet
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des fichiers');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleClick = async () => {
  try {
    if (!selectedPath) {
      throw new Error("Aucun fichier sélectionné");
    }

    // Récupère l'URL signée pour obtenir la taille réelle
    const { data: urlData, error: urlError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(selectedPath, 60); // URL temporaire

    if (urlError || !urlData?.signedUrl) {
      throw new Error("Impossible de récupérer l'URL du fichier");
    }

    const headRes = await fetch(urlData.signedUrl, { method: 'HEAD' });
    const contentLength = headRes.headers.get('content-length');

    if (!contentLength) {
      throw new Error("Impossible de récupérer la taille du fichier");
    }

    const fileSizeMB = parseInt(contentLength, 10) / (1024 * 1024);
    if (fileSizeMB > 20) {
      throw new Error(`Le fichier est trop volumineux (${fileSizeMB.toFixed(2)} Mo). Maximum : 20 Mo.`);
    }

    // OK, on envoie la requête
    const response = await postToBackend('/analyze-invoice', {
      storagePath: selectedPath,
    });

    setResult(response.text || JSON.stringify(response, null, 2));
    setError('');
  } catch (err: any) {
    setError(err.message || 'Erreur inconnue');
    setResult('');
  }
};


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test appel backend</h1>

      {loading ? (
        <p>Chargement des fichiers...</p>
      ) : files.length === 0 ? (
        <p>Aucun fichier PDF disponible</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sélectionner un fichier PDF
            </label>
            <select
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {files.map((file) => (
                <option key={file.fullPath} value={file.fullPath}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleClick} className="px-4 py-2 bg-blue-600 text-white rounded">
            Analyser le PDF sélectionné
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
          Erreur : {error}
        </div>
      )}

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 border rounded whitespace-pre-wrap text-sm">
          {result}
        </pre>
      )}
    </div>
  );
}
