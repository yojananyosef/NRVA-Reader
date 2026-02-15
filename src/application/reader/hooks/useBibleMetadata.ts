import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { bibleTitles, titlesLoading, titlesError, loadBibleTitles } from '../../../stores/bibleMetadata';
import booksIndex from "../../../data/books-index.json";
import type { ChapterTitleContent } from '../../../domain/bible/MetadataEntities';

/**
 * useBibleMetadata (Application Hook)
 *
 * Responsabilidad Única: Gestionar la carga y el acceso a los metadatos globales (títulos).
 * Proporciona el estado global de títulos y funciones helper.
 */
export function useBibleMetadata() {
    const titles = useStore(bibleTitles);
    const loading = useStore(titlesLoading);
    const error = useStore(titlesError);

    useEffect(() => {
        loadBibleTitles();
    }, []);

    /**
     * Obtiene los títulos de un capítulo específico.
     * @param bookCode Código del libro (ej: 'gen')
     * @param chapter Número de capítulo
     */
    const getChapterTitles = (bookCode: string, chapter: string | number): ChapterTitleContent[] => {
        if (!titles.length) return [];

        const bookEntry = booksIndex.find(b => b.code === bookCode);
        if (!bookEntry) return [];

        const bookTitles = titles.find(t =>
            t?.display?.toLowerCase() === bookEntry.name.toLowerCase()
        );
        if (!bookTitles) return [];

        const chapterNum = typeof chapter === 'string' ? parseInt(chapter) : chapter;
        const chapterData = bookTitles.chapters?.find((c: any) => c.chapter === chapterNum);

        return (chapterData?.content || []) as ChapterTitleContent[];
    };

    return { titles, loading, error, getChapterTitles };
}
