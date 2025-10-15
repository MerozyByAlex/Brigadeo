export function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}