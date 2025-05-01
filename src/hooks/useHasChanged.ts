import { useMemo } from 'react';

/**
 * Hook générique qui compare deux valeurs et retourne true si elles sont différentes.
 * Utilise JSON.stringify pour une comparaison profonde des objets.
 * 
 * @param initialValue La valeur initiale à comparer
 * @param currentValue La valeur actuelle
 * @returns boolean Indiquant si la valeur a changé
 */
export function useHasChanged<T>(initialValue: T, currentValue: T): boolean {
  return useMemo(
    () => JSON.stringify(initialValue) !== JSON.stringify(currentValue),
    [initialValue, currentValue]
  );
}