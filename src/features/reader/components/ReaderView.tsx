import { useState, useEffect, useMemo } from 'preact/hooks';
import { BookOpen, Library, Info, EyeOff, Eye, ChevronDown, ChevronUp } from "lucide-preact";
import booksIndex from "../../../data/books-index.json";
import { highlights, toggleHighlight } from "../../../stores/highlights";
import { useStore } from '@nanostores/preact';
import ArrowNavigation from '../../../components/common/ArrowNavigation';
import { getNextChapter, getPrevChapter } from '../../../utils/navigation';
import { formatRedLetters } from '../../../utils/redLetterUtils';
import { preferences } from '../../../stores/preferences';

// Hooks de aplicación (Application Layer)
import { useReaderParams } from '../../../application/reader/hooks/useReaderParams';
import { useBibleData } from '../../../application/reader/hooks/useBibleData';
import { useBibleSearch } from '../../../application/search/hooks/useBibleSearch';
import { sanitizeHTML } from '../../../utils/security';

export default function ReaderView() {
    // 1. Gestión de Estado de Aplicación (Hooks)
    const { params, isSearching, setParams } = useReaderParams();
    const { bookData, commentaryData, loading: bibleLoading, error: bibleError } = useBibleData(params.book, isSearching);
    const {
        searchResults,
        multiPassageData,
        loading: searchLoading,
        collapsedPassages,
        toggleCollapse
    } = useBibleSearch(params.search || "");

    // 2. Estado local de UI (Presentation Layer)
    const [viewMode, setViewMode] = useState<'full' | 'partial'>('full');
    const [activeNote, setActiveNote] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // UI Loading

    // Stores globales
    const $highlights = useStore(highlights);
    const $preferences = useStore(preferences);

    // Sincronizar carga con el estado global de carga
    useEffect(() => {
        if (isSearching) {
            setLoading(searchLoading);
        } else {
            setLoading(bibleLoading);
        }
    }, [bibleLoading, searchLoading, isSearching]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#note-') || hash.startsWith('#v-')) {
                setActiveNote(hash.substring(1));
            } else {
                setActiveNote(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const { book: bookKey, chapter: chapterKey, verses: versesRange } = params;

    const currentBookEntry = useMemo(() => {
        return booksIndex.find((b) => b.code === bookKey) || booksIndex[0];
    }, [bookKey]);




    const safeParseInt = (s: string) => {
        const n = parseInt(s, 10);
        return isNaN(n) ? null : n;
    };

    const currentChapNum = safeParseInt(chapterKey) || 1;

    const prevLink = useMemo(() => {
        const target = getPrevChapter(bookKey, currentChapNum);
        return target ? `/?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNum]);

    const nextLink = useMemo(() => {
        const target = getNextChapter(bookKey, currentChapNum);
        return target ? `/?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNum]);

    const parseVerseRange = (range: string): number[] => {
        const result: number[] = [];
        if (!range) return result;
        const parts = range.split(",");
        parts.forEach((part) => {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map(Number);
                for (let i = start; i <= end; i++) result.push(i);
            } else {
                const n = Number(part);
                if (!isNaN(n)) result.push(n);
            }
        });
        return result;
    };

    const requiredVerses = useMemo(() => parseVerseRange(versesRange), [versesRange]);
    const chapterData = bookData?.capitulo?.[chapterKey] || {};

    const processedData = useMemo(() => {
        const footnotes: string[] = [];
        let noteCounter = 1;

        // Importante: Ordenar las entradas del capítulo numéricamente ANTES de procesarlas
        // para que las notas se colecten y numeren en el orden correcto del texto.
        const sortedEntries = Object.entries(chapterData).sort((a, b) => {
            return parseInt(a[0]) - parseInt(b[0]);
        });

        const versesList = sortedEntries.map(([num, content]) => {
            let text = "";
            let verseNotes: number[] = [];
            let header = "";

            if (typeof content === "string") {
                text = content;
            } else if (typeof content === "object" && content !== null) {
                text = (content as any).texto || "";

                if ((content as any).titulos && Array.isArray((content as any).titulos) && (content as any).titulos.length > 0) {
                    header = (content as any).titulos[0];
                }

                const notes = (content as any).notas as string[] | undefined;
                if (notes && Array.isArray(notes)) {
                    notes.forEach((note) => {
                        if (note && note.trim() !== "") {
                            footnotes.push(note);
                            verseNotes.push(noteCounter++);
                        }
                    });
                }
            }

            const verseNum = parseInt(num);
            const isHighlighted = requiredVerses.length > 0 && requiredVerses.includes(verseNum);

            return {
                number: num,
                text,
                noteIndices: verseNotes,
                isHighlighted,
                header,
            };
        });

        return { versesList, footnotes };
    }, [chapterData, requiredVerses]);

    const { versesList, footnotes } = processedData;



    const highlightedCount = versesList.filter((v) => v.isHighlighted).length;

    const currentCommentaryChapter = commentaryData?.chapters?.find(
        (c: any) => c.chapter === currentChapNum
    );
    const currentChapterCommentaryVerses = currentCommentaryChapter?.verses || [];

    useEffect(() => {
        if (!loading && activeNote) {
            const scrollWithRetry = (retries = 5) => {
                const element = document.getElementById(activeNote);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    setTimeout(() => {
                        const rect = element.getBoundingClientRect();
                        if (Math.abs(rect.top - 112) > 50) { // 112px es el scroll-mt-28
                            const top = rect.top + window.pageYOffset - 112;
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
    }, [loading, activeNote]);

    if (loading) {
        return (
            <div class="flex items-center justify-center min-h-[50vh]" role="status" aria-label="Cargando contenido">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
                <span class="sr-only">Cargando...</span>
            </div>
        );
    }

    if (bibleError) {
        return (
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4" role="alert">
                <Info class="w-12 h-12 text-red-500 mb-4 opacity-50" aria-hidden="true" />
                <h2 class="text-xl font-bold mb-2">Error al cargar el contenido</h2>
                <p class="opacity-70 mb-6">No pudimos cargar {currentBookEntry.name}.</p>
                <p class="text-sm opacity-50 mb-6">{bibleError.message}</p>
                <button
                    onClick={() => window.location.reload()}
                    class="px-4 py-2 bg-[var(--color-link)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    aria-label="Reintentar cargar el contenido"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!isSearching && !bookData) {
        return (
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4" role="alert">
                <Info class="w-12 h-12 text-red-500 mb-4 opacity-50" aria-hidden="true" />
                <h2 class="text-xl font-bold mb-2">Libro no encontrado</h2>
                <p class="opacity-70 mb-6">No pudimos encontrar los datos para {currentBookEntry.name}.</p>
                <button
                    onClick={() => window.location.reload()}
                    class="px-4 py-2 bg-[var(--color-link)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    aria-label="Reintentar cargar el contenido"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (isSearching) {
        return (
            <article class="reader-content max-w-3xl mx-auto pb-12 px-2 md:px-0 relative animate-in fade-in duration-700">
                <div class="space-y-12">
                    {searchResults.map((result, idx) => {
                        const book = multiPassageData[result.book];
                        if (!book) return null;

                        const chapterData = book.capitulo?.[result.chapter];
                        if (!chapterData) return null;

                        const bookEntry = booksIndex.find(b => b.code === result.book);
                        const passageId = `${result.book}-${result.chapter}-${idx}`;
                        const isCollapsed = collapsedPassages[passageId];

                        // Filtrar versículos si hay un rango específico
                        const versesToRender = Object.entries(chapterData)
                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                            .filter(([num]) => !result.verses || result.verses.includes(parseInt(num)));

                        return (
                            <div key={passageId} class="space-y-4">
                                <div
                                    class="flex items-center gap-4 mb-2 sticky top-16 bg-[var(--color-bg)]/80 backdrop-blur-sm py-2 z-10 cursor-pointer group"
                                    onClick={() => toggleCollapse(passageId)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleCollapse(passageId);
                                        }
                                    }}
                                    role="button"
                                    aria-expanded={!isCollapsed}
                                    tabIndex={0}
                                >
                                    <h2 class="text-xl font-bold text-[var(--color-link)] flex items-center gap-2">
                                        {bookEntry?.name} {result.chapter}
                                        {result.verses && result.verses.length > 0 && (
                                            <span class="text-sm font-normal opacity-60">
                                                (v. {result.verses[0]}{result.verses.length > 1 ? `-${result.verses[result.verses.length - 1]}` : ''})
                                            </span>
                                        )}
                                        <span class="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                            {isCollapsed ? <ChevronDown class="w-5 h-5" /> : <ChevronUp class="w-5 h-5" />}
                                        </span>
                                    </h2>
                                    <div class="h-px flex-1 bg-[var(--color-link)]/20" />
                                </div>

                                {!isCollapsed && (
                                    <div class="verses space-y-4 reader-text animate-in slide-in-from-top-2 duration-300">
                                        {(() => {
                                            return versesToRender.map(([num, content]) => {
                                                const verseText = typeof content === "string" ? content : (content as any).texto || "";
                                                const verseId = `${result.book}-${result.chapter}-${num}`;
                                                const isGlobalHighlighted = $highlights[verseId];
                                                const verseNum = parseInt(num);

                                                let verseTitle = "";
                                                if (typeof content === "object" && content !== null && (content as any).titulos && Array.isArray((content as any).titulos) && (content as any).titulos.length > 0) {
                                                    verseTitle = (content as any).titulos[0];
                                                }

                                                return (
                                                    <div key={num} class="space-y-4">
                                                        {verseTitle && (
                                                            <h3 class="text-lg font-bold text-[var(--color-text)] opacity-80 mt-8 mb-4 border-l-4 border-[var(--color-link)] pl-4">
                                                                {verseTitle}
                                                            </h3>
                                                        )}
                                                        <p
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleHighlight(verseId);
                                                            }}
                                                            class={`relative p-2 -mx-2 rounded transition-all cursor-pointer verse-item group
                                                                ${isGlobalHighlighted ? 'is-user-highlighted' : ''}
                                                            `}
                                                            style={{ color: 'var(--color-text)' }}
                                                        >
                                                            <span class="verse-num inline-block font-bold mr-2 select-none align-baseline opacity-40" aria-hidden="true">
                                                                {num}
                                                            </span>
                                                            <span class="sr-only">Versículo {num} </span>
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: sanitizeHTML($preferences.showRedLetters
                                                                    ? formatRedLetters(verseText, result.book, result.chapter, verseNum)
                                                                    : verseText)
                                                            }} />
                                                        </p>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div class="mt-12 pt-8 border-t border-theme-text/20 text-center">
                    <button
                        onClick={() => {
                            window.history.pushState({}, '', '/');
                            window.dispatchEvent(new CustomEvent('app:navigate', {
                                detail: { book: 'gen', chapter: '1' }
                            }));
                        }}
                        class="px-6 py-2 rounded-full border border-[var(--color-link)] text-[var(--color-link)] hover:bg-[var(--color-link)]/5 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </article>
        );
    }

    const filteredVerses = viewMode === 'partial' ? versesList.filter(v => v.isHighlighted) : versesList;

    const handleNavigate = (url: string) => {
        const newUrl = new URL(url, window.location.origin);
        const book = newUrl.searchParams.get('book') || 'gen';
        const chapter = newUrl.searchParams.get('chapter') || '1';
        const verses = newUrl.searchParams.get('verses') || '';

        // Actualizar URL sin recargar
        window.history.pushState({}, '', url);

        // Actualizar estado local
        setParams({ book, chapter, verses, search: '' });

        // Hacer scroll arriba instantáneo para mejor sensación de inmediatez
        window.scrollTo(0, 0);
    };

    return (
        <article class="reader-content max-w-3xl mx-auto pb-12 px-2 md:px-0 relative animate-in fade-in duration-700">
            <div class="mb-8 text-center px-2 ui-protect">
                <h1 class="text-2xl md:text-4xl font-bold text-[var(--color-link)] mb-2">
                    {bookData?.nombre || currentBookEntry.name} {chapterKey}
                </h1>
                {versesRange && (
                    <div class="flex flex-wrap items-center justify-center gap-3 mt-4">
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-link)] text-[var(--color-link)] bg-[var(--color-link)]/5">
                            <Info class="w-4 h-4" />
                            <span class="text-sm font-medium">
                                Plan de lectura: versículos {versesRange}
                            </span>
                        </div>
                        <span class="text-sm opacity-60">
                            {highlightedCount} de {versesList.length} versículos
                        </span>
                        <button
                            onClick={() => setViewMode(viewMode === 'full' ? 'partial' : 'full')}
                            class="text-sm px-3 py-1.5 rounded-md border border-theme-text/20 hover:bg-theme-text/5 transition-colors flex items-center gap-2 ui-protect"
                        >
                            <span>{viewMode === 'full' ? 'Ver solo requeridos' : 'Ver todo el capítulo'}</span>
                            {viewMode === 'full' ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            {versesRange && (
                <div class="mb-8 p-4 rounded-xl border border-[var(--color-link)]/30 bg-[var(--color-link)]/5 flex gap-4 items-start animate-fade-in ui-protect">
                    <div class="p-2 rounded-lg bg-[var(--color-link)] text-white shrink-0">
                        <BookOpen class="w-5 h-5" />
                    </div>
                    <div class="text-left">
                        <h3 class="font-bold text-[var(--color-link)]">Guía de lectura</h3>
                        <p class="text-sm opacity-80 leading-relaxed">
                            Estás siguiendo un plan de lectura. Los versículos resaltados son los asignados para hoy.
                            Puedes cambiar a "Vista Parcial" para enfocarte solo en ellos.
                        </p>
                    </div>
                </div>
            )}

            <ArrowNavigation
                prevHref={prevLink}
                nextHref={nextLink}
                onPrev={prevLink ? (e) => { e.preventDefault(); handleNavigate(prevLink); } : undefined}
                onNext={nextLink ? (e) => { e.preventDefault(); handleNavigate(nextLink); } : undefined}
                prevLabel="Capítulo Anterior"
                nextLabel="Capítulo Siguiente"
            />

            <div class="verses space-y-4 reader-text">
                {(() => {
                    return filteredVerses.map((verse) => {
                        const verseId = `${bookKey}-${chapterKey}-${verse.number}`;
                        const isGlobalHighlighted = $highlights[verseId];
                        const verseNum = parseInt(verse.number);

                        return (
                            <div key={verse.number} class="space-y-4">
                                {(verse as any).header && (
                                    <h3 class="text-lg font-bold text-[var(--color-text)] opacity-80 mt-8 mb-4 border-l-4 border-[var(--color-link)] pl-4">
                                        {(verse as any).header}
                                    </h3>
                                )}
                                <p
                                    id={`v-${verse.number}`}
                                    onClick={() => toggleHighlight(verseId)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleHighlight(verseId);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={!!isGlobalHighlighted}
                                    class={`relative p-2 -mx-2 rounded transition-all cursor-pointer verse-item group
                                        ${verse.isHighlighted ? "is-plan-highlighted" : ""} 
                                        ${isGlobalHighlighted ? 'is-user-highlighted' : ''} 
                                        ${activeNote === `v-${verse.number}` ? 'verse-selected' : ''}
                                    `}
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    <span class={`verse-num inline-block font-bold mr-2 select-none align-baseline ${verse.isHighlighted ? "text-[var(--color-link)] opacity-100" : "opacity-40"}`} aria-hidden="true">
                                        {verse.number}
                                    </span>
                                    <span class="sr-only">Versículo {verse.number} </span>
                                    <span
                                        class={verse.isHighlighted ? "font-medium" : ""}
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeHTML($preferences.showRedLetters
                                                ? formatRedLetters(verse.text, bookKey, currentChapNum, verseNum)
                                                : verse.text)
                                        }}
                                    />
                                    {currentChapterCommentaryVerses.some((c: any) => c.verse === parseInt(verse.number)) && (
                                        <a
                                            href={`/commentary?book=${bookKey}&chapter=${chapterKey}#com-${verse.number}`}
                                            class="commentary-icon inline-flex"
                                            title="Ver comentario"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Library class="w-full h-full" />
                                        </a>
                                    )}
                                    {verse.noteIndices.map((idx) => (
                                        <a
                                            key={idx}
                                            href={`#note-${idx}`}
                                            class="footnote-ref"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {idx}
                                        </a>
                                    ))}
                                </p>
                            </div>
                        );
                    });
                })()}
            </div>

            {footnotes.length > 0 && (
                <div class="mt-16 pt-8 border-t border-theme-text/20 mb-12" id="footnotes" key={`${bookKey}-${chapterKey}-footnotes`}>
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                        <BookOpen class="w-5 h-5" />
                        Notas del Capítulo ({footnotes.length})
                    </h3>
                    <ol class="list-none space-y-3 reader-text opacity-80" style={{ color: 'var(--color-text)' }}>
                        {footnotes.map((note, idx) => (
                            <li key={`${idx}-${chapterKey}`} id={`note-${idx + 1}`} class={`pl-2 flex gap-2 group p-2 hover:bg-theme-text/5 rounded transition-colors scroll-mt-28 ${activeNote === `note-${idx + 1}` ? 'note-selected shadow-sm' : ''}`}>
                                <span class="font-bold text-[var(--color-link)] shrink-0">[{idx + 1}]</span>
                                <span>{note}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </article>
    );
}
