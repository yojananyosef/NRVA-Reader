import { atom } from 'nanostores';
import { fetchWithCache } from '../utils/fetchWithCache';
import type { BookTitle } from '../domain/bible/MetadataEntities';

export const bibleTitles = atom<BookTitle[]>([]);
export const titlesLoading = atom<boolean>(false);
export const titlesError = atom<Error | null>(null);

let fetchPromise: Promise<void> | null = null;

export function loadBibleTitles() {
    // Si ya tenemos datos o estamos cargando, no hacer nada
    if (bibleTitles.get().length > 0 || titlesLoading.get()) return;

    titlesLoading.set(true);
    titlesError.set(null);

    // Evitar múltiples llamadas simultáneas
    if (!fetchPromise) {
        fetchPromise = fetchWithCache<any>('/data/titles/headers.json')
            .then(data => {
                if (data && data.data) {
                    // Manejar la estructura anidada del JSON actual
                    const flattened = Array.isArray(data.data[0]) ? data.data[0] : data.data;
                    bibleTitles.set(flattened);
                }
            })
            .catch(err => {
                console.error("Error loading titles:", err);
                titlesError.set(err instanceof Error ? err : new Error('Unknown error loading titles'));
            })
            .finally(() => {
                titlesLoading.set(false);
                fetchPromise = null;
            });
    }

    return fetchPromise;
}
