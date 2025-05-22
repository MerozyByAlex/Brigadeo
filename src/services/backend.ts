const BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;

if (!BACKEND_URL) {
  throw new Error('La variable d\'environnement VITE_BACKEND_URL est manquante');
}

export async function postToBackend<T = any>(path: string, body: any): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur ${response.status}: ${errorText}`);
  }

  return await response.json();
}