import { useMemo, useEffect } from 'preact/hooks';
import { Library } from "lucide-preact";
import booksIndex from "../../../data/books-index.json";
import CommentarySelector from "./CommentarySelector";
import ArrowNavigation from '../../../components/common/ArrowNavigation';
import { getNextChapter, getPrevChapter } from '../../../utils/navigation';

// Hooks de aplicación
import { useCommentaryParams, useCommentaryData } from '../../../application/commentary/hooks/useCommentary';

export default function CommentaryView() {
    // 1. Gestión de Parámetros y Navegación
    const { params, setParams, activeCommentary } = useCommentaryParams();
    const { book: bookKey, chapter: chapterKey } = params;

    // 2. Gestión de Datos
    const { commentaryData, loading, error, currentBookEntry } = useCommentaryData(bookKey);

    const currentChapNumInt = parseInt(chapterKey, 10) || 1;

    // Obtener contenido del capítulo actual
    const currentChapterData = useMemo(() => {
        if (!commentaryData || !commentaryData.chapters) return null;
        return commentaryData.chapters.find((c: any) => c.chapter === currentChapNumInt);
    }, [commentaryData, currentChapNumInt]);

    const currentChapterCommentaryVerses = currentChapterData?.verses || [];

    // Calcular navegación
    const prevChapter = getPrevChapter(bookKey, currentChapNumInt);
    const nextChapter = getNextChapter(bookKey, currentChapNumInt);

    const prevLink = prevChapter ? `?book=${prevChapter.book}&chapter=${prevChapter.chapter}` : undefined;
    const nextLink = nextChapter ? `?book=${nextChapter.book}&chapter=${nextChapter.chapter}` : undefined;

    const handleNavigate = (url: string) => {
        const newUrl = new URL(url, window.location.origin);
        const book = newUrl.searchParams.get('book') || 'gen';
        const chapter = newUrl.searchParams.get('chapter') || '1';

        // Actualizar URL sin recargar
        window.history.pushState({}, '', url);

        // Actualizar estado
        setParams({ book, chapter });

        // Scroll arriba
        window.scrollTo(0, 0);
    };

    // Scroll a comentario activo
    useEffect(() => {
        if (!loading && activeCommentary) {
            const scrollWithRetry = (retries = 5) => {
                const element = document.getElementById(activeCommentary);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Si después de un momento no estamos cerca, forzarlo con scrollTo
                    setTimeout(() => {
                        const rect = element.getBoundingClientRect();
                        if (Math.abs(rect.top - 96) > 50) { // 96px es el scroll-mt-24
                            const top = rect.top + window.pageYOffset - 96;
                            window.scrollTo({ top, behavior: 'smooth' });
                        }
                    }, 500);
                } else if (retries > 0) {
                    setTimeout(() => scrollWithRetry(retries - 1), 200);
                }
            };

            const timer = setTimeout(() => scrollWithRetry(), 100);
            return () => clearTimeout(timer);
        }
    }, [loading, activeCommentary]);

    if (loading) {
        return (
            <div class="flex items-center justify-center min-h-[50vh]" role="status" aria-label="Cargando comentario">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
                <span class="sr-only">Cargando...</span>
            </div>
        );
    }

    if (error || !commentaryData) {
        return (
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4" role="alert">
                <Library class="w-12 h-12 text-red-500 mb-4 opacity-50" aria-hidden="true" />
                <h2 class="text-xl font-bold mb-2">Error al cargar comentario</h2>
                <p class="opacity-70 mb-6">No pudimos cargar los datos para {currentBookEntry?.name || bookKey}.</p>
                <button
                    onClick={() => window.location.reload()}
                    class="px-4 py-2 bg-[var(--color-link)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    aria-label="Reintentar cargar"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <article class="reader-content max-w-3xl mx-auto pb-12 px-2 md:px-0 relative animate-in fade-in duration-700">
            <div class="mb-8 text-center px-2 ui-protect">
                <h1 class="text-2xl md:text-4xl font-bold text-[var(--color-link)] mb-4">
                    Comentario: {currentBookEntry.name} {currentChapNumInt}
                </h1>
                <CommentarySelector
                    books={booksIndex}
                    currentBook={bookKey}
                    currentChapter={currentChapNumInt}
                    onNavigate={handleNavigate}
                />
            </div>

            <ArrowNavigation
                prevHref={prevLink}
                nextHref={nextLink}
                onPrev={prevLink ? (e) => { e.preventDefault(); handleNavigate(prevLink); } : undefined}
                onNext={nextLink ? (e) => { e.preventDefault(); handleNavigate(nextLink); } : undefined}
                prevLabel="Capítulo Anterior"
                nextLabel="Capítulo Siguiente"
            />

            <div class="space-y-6 md:space-y-12">
                {/* Book Introduction (only on chapter 1) */}
                {currentChapNumInt === 1 && commentaryData?.introduction && (
                    <div class="mb-12 p-6 md:p-8 rounded-2xl bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] shadow-sm">
                        {commentaryData.introduction.fullTitle && (
                            <h2 class="text-xl md:text-2xl font-bold mb-2 text-center text-[var(--color-link)] ui-protect">
                                {commentaryData.introduction.fullTitle}
                            </h2>
                        )}
                        {commentaryData.introduction.subtitle && (
                            <h3 class="text-lg md:text-xl font-medium mb-6 text-center opacity-70 italic ui-protect">
                                {commentaryData.introduction.subtitle}
                            </h3>
                        )}
                        <div class="space-y-6 mt-8">
                            {commentaryData.introduction.sections?.map((section: any, sIdx: number) => (
                                <div key={sIdx} class="max-w-none">
                                    {section.title && (
                                        <h4 class="text-lg font-bold mb-2 text-[var(--color-link)] ui-protect">
                                            {section.title}
                                        </h4>
                                    )}
                                    <div
                                        class="text-[var(--color-text)] reader-text"
                                        dangerouslySetInnerHTML={{ __html: section.content }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentChapterCommentaryVerses.length > 0 ? (
                    currentChapterCommentaryVerses.map((v: any, _idxx: number) => (
                        <div
                            id={`com-${v.verse}`}
                            key={v.verse}
                            class={`p-2 md:p-4 rounded-xl transition-all duration-300 ${activeCommentary === `com-${v.verse}` ? 'commentary-selected shadow-sm' : 'hover:bg-[var(--surface-hover-bg)]'}`}
                        >
                            <div class="flex items-center gap-2 mb-2 ui-protect">
                                <span class="bg-[var(--color-link)] text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ui-protect">
                                    Versículo {v.verse}
                                </span>
                            </div>
                            <div class="text-[var(--color-text)] reader-text max-w-none">
                                {v.phrase && (
                                    <span class="font-bold mr-2 text-[var(--color-link)] italic">
                                        {v.phrase}
                                    </span>
                                )}
                                <span dangerouslySetInnerHTML={{ __html: v.content }} />
                            </div>
                            {v.references && v.references.length > 0 && (
                                <div class="mt-4 pt-2 border-t border-theme-text/10 flex flex-wrap gap-2">
                                    {v.references.map((ref: string, rIdx: number) => (
                                        <span key={rIdx} class="text-[10px] opacity-50 bg-[var(--surface-muted-bg)] px-1.5 py-0.5 rounded">
                                            {ref}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div class="text-center py-20 opacity-50 italic">
                        No hay comentarios disponibles para este capítulo.
                    </div>
                )}
            </div>
        </article>
    );
}
