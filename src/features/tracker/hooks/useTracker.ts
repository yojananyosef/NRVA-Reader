import { useCallback } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { tracker, toggleChapterCompletion, resetTrackerProgress } from '../../../stores/tracker';
import booksData from '../../../data/books-index.json';

export type Book = {
  code: string;
  name: string;
  chapters: number;
  section: string;
};

/**
 * useTracker (Application Hook)
 * 
 * Responsabilidad Única: Proporcionar acceso y lógica derivada del progreso de lectura.
 * Utiliza el store global 'tracker' para la persistencia.
 */
export function useTracker() {
  const completedChapters = useStore(tracker);

  // Nanostores carga síncronamente del localStorage, así que no hay "loading" real
  // a menos que queramos esperar a la hidratación, pero useStore maneja updates.
  const isLoading = false;

  const toggleChapter = useCallback((bookCode: string, chapter: number) => {
    toggleChapterCompletion(bookCode, chapter);
  }, []);

  const isChapterCompleted = useCallback((bookCode: string, chapter: number) => {
    return completedChapters[bookCode]?.includes(chapter) || false;
  }, [completedChapters]);

  const getBookProgress = useCallback((bookCode: string) => {
    const book = booksData.find((b) => b.code === bookCode);
    if (!book) return 0;
    const completedCount = completedChapters[bookCode]?.length || 0;
    const progress = (completedCount / book.chapters) * 100;
    return Number(progress.toFixed(1));
  }, [completedChapters]);

  const getTotalProgress = useCallback(() => {
    const totalChapters = booksData.reduce((acc, book) => acc + book.chapters, 0);
    const totalCompleted = Object.values(completedChapters).reduce(
      (acc, chapters) => acc + chapters.length,
      0
    );
    const progress = (totalCompleted / totalChapters) * 100;
    return Number(progress.toFixed(1));
  }, [completedChapters]);

  const resetProgress = useCallback(() => {
    if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
      resetTrackerProgress();
    }
  }, []);

  return {
    completedChapters,
    isLoading,
    toggleChapter,
    isChapterCompleted,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    books: booksData as Book[],
  };
}
