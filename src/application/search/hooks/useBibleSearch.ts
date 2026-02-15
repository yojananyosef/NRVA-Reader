import { useState, useEffect } from 'preact/hooks';
import { fetchBibleBook } from '../../../utils/bibleService';
import { parseBibleQuery } from '../../../utils/bibleParser';
import type { BiblePassage } from '../../../domain/search/SearchEntities';

interface UseBibleSearchReturn {
    searchResults: BiblePassage[];
    multiPassageData: Record<string, any>;
    loading: boolean;
    error: Error | null;
    collapsedPassages: Record<string, boolean>;
    toggleCollapse: (id: string) => void;
}

/**
 * useBibleSearch (Application Hook)
 * 
 * Responsabilidad Única: Gestionar la lógica de búsqueda de pasajes bíblicos.
 * Parsea la consulta, obtiene los datos de los libros necesarios y gestiona el estado de la vista.
 */
export function useBibleSearch(searchQuery: string): UseBibleSearchReturn {
    const [searchResults, setSearchResults] = useState<BiblePassage[]>([]);
    const [multiPassageData, setMultiPassageData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [collapsedPassages, setCollapsedPassages] = useState<Record<string, boolean>>({});

    // 1. Parsear la consulta cuando cambia
    useEffect(() => {
        if (searchQuery) {
            try {
                // Parsear la consulta
                const parsed = parseBibleQuery(searchQuery);
                setSearchResults(parsed);
                // Resetear estados al cambiar búsqueda
                setCollapsedPassages({});
                setError(null);
            } catch (err) {
                console.error("Error parsing search query:", err);
                setSearchResults([]);
                setError(err instanceof Error ? err : new Error("Error al procesar la búsqueda"));
            }
        } else {
            setSearchResults([]);
            setMultiPassageData({});
        }
    }, [searchQuery]);

    // 2. Cargar datos de libros necesarios
    useEffect(() => {
        if (!searchQuery || searchResults.length === 0) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function loadMultiData() {
            setLoading(true);
            setError(null);

            try {
                // Identificar libros únicos necesarios
                const uniqueBooks = Array.from(new Set(searchResults.map(r => r.book)));

                // Cargar todos los libros necesarios
                const bookRequests = uniqueBooks.map(code => fetchBibleBook(code));
                const booksResults = await Promise.all(bookRequests);

                if (isMounted) {
                    const bookMap = uniqueBooks.reduce((acc, code, i) => {
                        acc[code] = booksResults[i];
                        return acc;
                    }, {} as Record<string, any>);

                    setMultiPassageData(bookMap);
                }
            } catch (e) {
                console.error("Error loading multi-passage data:", e);
                if (isMounted) {
                    setError(e instanceof Error ? e : new Error("Error al cargar los libros para la búsqueda"));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadMultiData();

        return () => {
            isMounted = false;
        };
    }, [searchResults]);

    // 3. Helper para colapsar resultados
    const toggleCollapse = (id: string) => {
        setCollapsedPassages(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return {
        searchResults,
        multiPassageData,
        loading,
        error,
        collapsedPassages,
        toggleCollapse
    };
}
