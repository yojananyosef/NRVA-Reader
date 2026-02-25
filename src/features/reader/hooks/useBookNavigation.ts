import { useState, useEffect } from 'preact/hooks';
import { parseBibleQuery, getBookSuggestions } from '../../../utils/bibleParser';
import { fetchBibleBook } from '../../../utils/bibleService';
import { lastBiblePosition } from '../../../stores/navigation';

export interface Book {
    code: string;
    name: string;
    chapters: number;
    section?: string;
}

interface UseBookNavigationProps {
    books: Book[];
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    projectVerse: (ref: any, versesText: string, fullRef: string) => void;
}

export function useBookNavigation({ books, isOpen, setIsOpen, projectVerse }: UseBookNavigationProps) {
    const [view, setView] = useState<'settings' | 'books' | 'chapters'>('settings');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['at']);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Book[]>([]);
    const [isProjectMode, setIsProjectMode] = useState(false);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);

        const parts = value.split(/[;,]/);
        const lastPart = parts[parts.length - 1].trim();

        if (lastPart && !/\d/.test(lastPart)) {
            const matches = getBookSuggestions(lastPart);
            setSuggestions(matches as Book[]);
        } else {
            setSuggestions([]);
        }
    };

    const applySuggestion = (bookName: string) => {
        const parts = searchQuery.split(/[;,]/);
        parts[parts.length - 1] = ` ${bookName} `;
        const newQuery = parts.join(';').trim() + ' ';
        setSearchQuery(newQuery);
        setSuggestions([]);
    };

    const handleSearch = async (e: any) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const results = parseBibleQuery(searchQuery);

        if (isProjectMode) {
            if (results.length > 0 && results[0].verses) {
                try {
                    const bookData = await fetchBibleBook(results[0].book);
                    const chapterNum = results[0].chapter.toString();
                    const chapter = bookData.capitulo[chapterNum];

                    if (chapter) {
                        const versesText = results[0].verses
                            .map(verseNum => {
                                const verse = chapter[verseNum.toString()];
                                return verse ? `<sup class="text-[0.6em] opacity-70 mr-1">${verseNum}</sup>${verse.texto || verse.text}` : null;
                            })
                            .filter(Boolean)
                            .join(' ');

                        if (versesText) {
                            const ref = `${bookData.nombre || bookData.name} ${results[0].chapter}:${results[0].verses.join('-')}`;
                            projectVerse(results[0], versesText, ref);
                            setSearchQuery('');
                            setSuggestions([]);
                        } else {
                            alert("No se encontró el texto del versículo especificado.");
                        }
                    } else {
                        alert("Capítulo no encontrado.");
                    }
                } catch (error) {
                    console.error("Error fetching book for projection", error);
                    alert("Error al cargar el libro para proyección.");
                }
            } else {
                alert("Para proyectar, por favor ingrese una referencia válida de versículo (ej. Juan 3:16).");
            }
            return;
        }

        let url = '';
        let detail: any = {};

        if (results.length > 0) {
            if (results.length === 1 && !results[0].verses) {
                url = `/?book=${results[0].book}&chapter=${results[0].chapter}`;
                lastBiblePosition.set({ lastBook: results[0].book, lastChapter: results[0].chapter.toString() });
                detail = { book: results[0].book, chapter: results[0].chapter.toString() };
            } else {
                const searchParam = encodeURIComponent(searchQuery);
                url = `/?search=${searchParam}`;
                detail = { search: searchQuery };
            }
        } else {
            const searchParam = encodeURIComponent(searchQuery);
            url = `/?search=${searchParam}`;
            detail = { search: searchQuery };
        }

        if (window.location.pathname === '/') {
            window.history.pushState({}, '', url);
            window.dispatchEvent(new CustomEvent('app:navigate', { detail }));
        } else {
            window.location.href = url;
        }

        setIsOpen(false);
    };

    const navigateToChapter = (chapter: number) => {
        if (selectedBook) {
            const baseUrl = '/';
            const url = `${baseUrl}?book=${selectedBook.code}&chapter=${chapter}`;
            lastBiblePosition.set({ lastBook: selectedBook.code, lastChapter: chapter.toString() });

            if (window.location.pathname === '/') {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new CustomEvent('app:navigate', {
                    detail: { url, book: selectedBook.code, chapter: String(chapter) }
                }));
            } else {
                window.location.href = url;
            }
            setIsOpen(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const otBooks = books.filter(b => b.section === 'at');
    const ntBooks = books.filter(b => b.section === 'nt');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('settings');
                setSelectedBook(null);
                setSearchQuery('');
                setIsProjectMode(false);
            }, 300);
        }
    }, [isOpen]);

    return {
        view,
        setView,
        selectedBook,
        setSelectedBook,
        expandedSections,
        toggleSection,
        searchQuery,
        setSearchQuery,
        suggestions,
        isProjectMode,
        setIsProjectMode,
        handleSearchInput,
        applySuggestion,
        handleSearch,
        navigateToChapter,
        otBooks,
        ntBooks
    };
}
