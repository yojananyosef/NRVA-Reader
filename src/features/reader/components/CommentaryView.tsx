import { useState, useEffect, useMemo } from 'preact/hooks';
import { Library } from "lucide-preact";
import booksIndex from "../../../data/books-index.json";
import { lastCommentaryPosition } from "../../../stores/navigation";
import CommentarySelector from "./CommentarySelector";
import { fetchWithCache } from '../../../utils/fetchWithCache';
import ArrowNavigation from '../../../components/common/ArrowNavigation';
import { getNextChapter, getPrevChapter } from '../../../utils/navigation';

export default function CommentaryView() {
    const [commentaryData, setCommentaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeCommentary, setActiveCommentary] = useState<string | null>(null);
    const [params, setParams] = useState({ book: 'gen', chapter: '1' });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#com-')) {
                setActiveCommentary(hash.substring(1));
            } else {
                setActiveCommentary(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const updateParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            let book = searchParams.get('book');
            let chapter = searchParams.get('chapter');

            // Si no hay parámetros en la URL, intentar cargar del estado persistente
            if (!book) {
                const stored = lastCommentaryPosition.get();
                if (stored.lastBook) {
                    book = stored.lastBook;
                    chapter = stored.lastChapter;
                }
            }

            setParams({
                book: book || 'gen',
                chapter: chapter || '1'
            });
        };

        const handleAppNavigate = (e: any) => {
            const { book, chapter } = e.detail;
            setParams({ book, chapter: chapter || '1' });
        };

        updateParams();
        window.addEventListener('popstate', updateParams);
        window.addEventListener('app:navigate' as any, handleAppNavigate);
        return () => {
            window.removeEventListener('popstate', updateParams);
            window.removeEventListener('app:navigate' as any, handleAppNavigate);
        };
    }, []);

    const { book: bookKey, chapter: chapterKey } = params;

    // Sincronizar estado persistente con la posición actual
    useEffect(() => {
        if (bookKey && chapterKey) {
            lastCommentaryPosition.set({
                lastBook: bookKey,
                lastChapter: chapterKey
            });
        }
    }, [bookKey, chapterKey]);

    const currentBookEntry = useMemo(() => {
        return booksIndex.find((b) => b.code === bookKey) || booksIndex[0];
    }, [bookKey]);
    const currentChapNumInt = parseInt(chapterKey, 10) || 1;

    // Load commentary data only when bookKey changes
    useEffect(() => {
        let isMounted = true;
        async function loadBookData() {
            // Only show loading if we don't have the data for this book yet
            if (!commentaryData || commentaryData.id !== currentBookEntry.code) {
                setLoading(true);
            }

            try {
                const bookCode = currentBookEntry.code;
                const data = await fetchWithCache<any>(`/data/commentary/${bookCode}.json`);

                if (!isMounted) return;
                setCommentaryData(data);
            } catch (e) {
                console.error("Error loading commentary data:", e);
                if (isMounted) setCommentaryData(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadBookData();
        return () => { isMounted = false; };
    }, [currentBookEntry.code]);

    // Update last position when book or chapter changes
    useEffect(() => {
        lastCommentaryPosition.set({ lastBook: bookKey, lastChapter: chapterKey });
    }, [bookKey, chapterKey]);


    const prevLink = useMemo(() => {
        const target = getPrevChapter(bookKey, currentChapNumInt);
        return target ? `/commentary?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNumInt]);

    const nextLink = useMemo(() => {
        const target = getNextChapter(bookKey, currentChapNumInt);
        return target ? `/commentary?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNumInt]);

    const currentCommentaryChapter = commentaryData?.chapters?.find(
        (c: any) => c.chapter === currentChapNumInt
    );
    const currentChapterCommentaryVerses = currentCommentaryChapter?.verses || [];

    useEffect(() => {
        if (!loading && activeCommentary) {
            const scrollWithRetry = (retries = 5) => {
                const element = document.getElementById(activeCommentary);
                if (element) {
                    console.log(`Scrolling to ${activeCommentary}`);
                    // Intentar scrollIntoView primero
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
            <div class="flex items-center justify-center min-h-[50vh]">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
            </div>
        );
    }

    if (!commentaryData && !loading) {
        return (
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <Library class="w-12 h-12 text-[var(--color-link)] mb-4 opacity-30" />
                <h2 class="text-xl font-bold mb-2">Sin comentarios</h2>
                <p class="opacity-70 mb-6">No pudimos cargar los comentarios para {currentBookEntry.name}.</p>
                <button
                    onClick={() => window.location.reload()}
                    class="px-4 py-2 bg-[var(--color-link)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const handleNavigate = (url: string) => {
        const newUrl = new URL(url, window.location.origin);
        const book = newUrl.searchParams.get('book') || 'gen';
        const chapter = newUrl.searchParams.get('chapter') || '1';

        // Actualizar URL sin recargar
        window.history.pushState({}, '', url);

        // Actualizar estado local
        setParams({ book, chapter });

        // Hacer scroll arriba instantáneo para mejor sensación de inmediatez
        window.scrollTo(0, 0);
    };

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
                    <div class="mb-12 p-6 md:p-8 rounded-2xl bg-theme-text/5 border border-theme-text/10 shadow-sm">
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
                            class={`p-2 md:p-4 rounded-xl transition-all duration-300 ${activeCommentary === `com-${v.verse}` ? 'commentary-selected shadow-sm' : 'hover:bg-theme-text/5'}`}
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
                                        <span key={rIdx} class="text-[10px] opacity-50 bg-theme-text/5 px-1.5 py-0.5 rounded">
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
