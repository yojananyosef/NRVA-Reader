import { useStore } from '@nanostores/preact';
import { createPortal } from 'preact/compat';
import { useEffect, useState, useRef } from 'preact/hooks';
import { preferences, PREFS_STORAGE_KEY, defaultPreferences } from '../../../stores/preferences';
import { Settings, X, Menu, ChevronRight, Play, Pause, BookSearch } from 'lucide-preact';
import ReaderRuler from './ReaderRuler';
import SettingsMenu from './SettingsMenu';
import BookNavigation from './BookNavigation';
import { useTTS } from '../../../application/reader/hooks/useTTS';
import { parseBibleQuery, getBookSuggestions } from '../../../utils/bibleParser';
import { lastBiblePosition } from '../../../stores/navigation';
import { useProjectionSender } from '../../projection/hooks/useProjection';
import { fetchBibleBook } from '../../../utils/bibleService';

interface Book {
    code: string;
    name: string;
    chapters: number;
    section?: string;
}

interface ReaderControlsProps {
    books?: Book[];
}

export default function ReaderControls({ books = [] }: ReaderControlsProps) {
    const $preferences = useStore(preferences);
    const [isOpen, setIsOpen] = useState(false);
    const { isPlaying, isPaused, isLoading, play, stop, setRate, voices, selectedVoice, setSelectedVoice } = useTTS();

    const handleAutoPlay = () => {
        // Encontrar el botón de "siguiente capítulo" en el DOM si existe
        const nextBtn = document.querySelector('[data-nav-next]') as HTMLElement;
        if (nextBtn) {
            nextBtn.click();

            // Re-intentar encontrar contenido para empezar a leer
            let retries = 0;
            const tryPlay = () => {
                const isCommentary = window.location.pathname.includes('commentary');
                const selector = isCommentary
                    ? '.reader-content h1, .reader-content .reader-text'
                    : '.reader-content h1, .reader-content p';

                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    play(selector, handleAutoPlay);
                } else if (retries < 10) {
                    retries++;
                    setTimeout(tryPlay, 500);
                }
            };

            setTimeout(tryPlay, 1000);
        }
    };

    // Safety sync on mount to ensure hydration matches localStorage
    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            try {
                const stored = localStorage.getItem(PREFS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const current = preferences.get();
                    // Deep compare simplified
                    if (JSON.stringify(parsed) !== JSON.stringify(current)) {
                        preferences.set({ ...defaultPreferences, ...parsed });
                    }
                }
            } catch (e) {
                console.error('Error syncing preferences on mount', e);
            }
        }

        // Cerrar controles si se abre el sidebar
        const handleToggleSidebar = () => {
            setIsOpen(false);
        };
        window.addEventListener('toggle-sidebar', handleToggleSidebar);

        return () => {
            window.removeEventListener('toggle-sidebar', handleToggleSidebar);
        };
    }, []);

    // Update rate from prefs
    useEffect(() => {
        setRate($preferences.speechRate);
    }, [$preferences.speechRate]);


    const [view, setView] = useState<'settings' | 'books' | 'chapters'>('settings');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['at']);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Book[]>([]);

    // Voice Selector State
    const [, setIsVoiceSelectorOpen] = useState(false);

    // Referencias para el control de clicks externos y z-index
    const voiceSelectorRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    // Efecto para asegurar z-index máximo y ocultar flechas
    useEffect(() => {
        if (isOpen && portalRef.current) {
            // Fuerza z-index máximo en el contenedor
            portalRef.current.style.setProperty('z-index', '2147483647', 'important');

            // Oculta flechas de navegación manipulando el DOM directamente para mayor seguridad
            const arrows = document.querySelectorAll('.nav-arrow, .nav-arrow-fixed');
            arrows.forEach(el => {
                (el as HTMLElement).style.setProperty('display', 'none', 'important');
            });
        } else {
            // Restaura flechas cuando se cierra
            const arrows = document.querySelectorAll('.nav-arrow, .nav-arrow-fixed');
            arrows.forEach(el => {
                (el as HTMLElement).style.removeProperty('display');
            });
        }

        return () => {
            // Limpieza al desmontar
            const arrows = document.querySelectorAll('.nav-arrow, .nav-arrow-fixed');
            arrows.forEach(el => {
                (el as HTMLElement).style.removeProperty('display');
            });
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (voiceSelectorRef.current && !voiceSelectorRef.current.contains(event.target as Node)) {
                setIsVoiceSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Projection Hook
    const { projectVerse, openProjectionWindow, isProjecting, clearProjection } = useProjectionSender();
    const [isProjectMode, setIsProjectMode] = useState(false);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);

        // Obtener última parte de la consulta si hay múltiples pasajes
        const parts = value.split(/[;,]/);
        const lastPart = parts[parts.length - 1].trim();

        // Solo sugerir si no hay números (es decir, aún está escribiendo el nombre del libro)
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
        // Enfocar el input de nuevo si es necesario
    };

    const handleSearch = async (e: any) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const results = parseBibleQuery(searchQuery);

        // MODO PROYECCIÓN: Si está activado, buscamos el versículo y lo enviamos
        if (isProjectMode) {
            if (results.length > 0 && results[0].verses) {
                try {
                    // Cargar el libro para obtener el texto
                    const bookData = await fetchBibleBook(results[0].book);

                    // La estructura de LocalBook es { capitulo: { "1": {...}, "2": {...} } }
                    // No es un array, es un objeto indexado por string de número de capítulo
                    const chapterNum = results[0].chapter.toString();
                    const chapter = bookData.capitulo[chapterNum];

                    if (chapter) {
                        // Mapear los versículos solicitados
                        const versesText = results[0].verses
                            .map(verseNum => {
                                const verse = chapter[verseNum.toString()];
                                // Incluir número de versículo para la proyección
                                return verse ? `<sup class="text-[0.6em] opacity-70 mr-1">${verseNum}</sup>${verse.texto || verse.text}` : null;
                            })
                            .filter(Boolean)
                            .join(' ');

                        if (versesText) {
                            const ref = `${bookData.nombre || bookData.name} ${results[0].chapter}:${results[0].verses.join('-')}`;
                            // Ya no forzamos la apertura automática para evitar recargas
                            // El usuario debe abrir la ventana con el botón dedicado
                            projectVerse(results[0], versesText, ref);

                            // Limpiar búsqueda
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
                // Si no es un versículo válido (ej. solo libro o capítulo), avisar
                alert("Para proyectar, por favor ingrese una referencia válida de versículo (ej. Juan 3:16).");
            }
            // IMPORTANTE: En modo proyección, NUNCA navegar en la app principal
            return;
        }

        // MODO NORMAL DE BÚSQUEDA
        let url = '';
        let detail = {};

        if (results.length > 0) {
            if (results.length === 1 && !results[0].verses) {
                // Navegación normal para un solo capítulo sin versículos específicos
                url = `/?book=${results[0].book}&chapter=${results[0].chapter}`;

                // Actualizar persistencia
                lastBiblePosition.set({ lastBook: results[0].book, lastChapter: results[0].chapter.toString() });

                detail = { book: results[0].book, chapter: results[0].chapter.toString() };
            } else {
                // Vista Multi-Pasaje (Logos Style)
                const searchParam = encodeURIComponent(searchQuery);
                url = `/?search=${searchParam}`;
                detail = { search: searchQuery };
            }
        } else {
            // Búsqueda de texto libre
            const searchParam = encodeURIComponent(searchQuery);
            url = `/?search=${searchParam}`;
            detail = { search: searchQuery };
        }

        // Si estamos en la raíz (Biblia), navegación SPA
        // Usamos window.location.pathname === '/' para asegurar que estamos en la vista de Biblia
        if (window.location.pathname === '/') {
            window.history.pushState({}, '', url);
            window.dispatchEvent(new CustomEvent('app:navigate', { detail }));
        } else {
            // Si estamos en otra vista (ej. Comentario, Planes), forzar navegación a la Biblia
            // Esto previene que el Comentario capture el evento app:navigate
            window.location.href = url;
        }

        setIsOpen(false);
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

    // Reset view when closing
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

    const navigateToChapter = (chapter: number) => {
        if (selectedBook) {
            // Siempre navegar a la vista de Biblia, independientemente de dónde estemos
            const baseUrl = '/';
            const url = `${baseUrl}?book=${selectedBook.code}&chapter=${chapter}`;

            // Actualizar persistencia de la Biblia
            lastBiblePosition.set({ lastBook: selectedBook.code, lastChapter: chapter.toString() });

            // Si ya estamos en la vista de Biblia, navegación SPA
            if (window.location.pathname === '/') {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new CustomEvent('app:navigate', {
                    detail: { url, book: selectedBook.code, chapter: String(chapter) }
                }));
            } else {
                // Si estamos en otra vista (ej. Comentario, Planes), forzar navegación a la Biblia
                window.location.href = url;
            }
            setIsOpen(false);
        }
    };

    return (
        <>
            <ReaderRuler />

            {/* Navbar */}
            <nav
                className="w-full h-16 border-b flex items-center justify-between px-4 md:px-8 transition-colors duration-300 ui-protect relative z-[40]"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'color-mix(in srgb, var(--color-text), transparent 85%)' }}
            >
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-[var(--color-link)] m-0" style={{ margin: 0 }}>Lectura Accesible</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                        }}
                        className="h-11 w-11 p-0 shrink-0 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex md:hidden items-center justify-center cursor-pointer bg-transparent border-none"
                        style={{ padding: 0, width: '44px', height: '44px', minWidth: '44px' }}
                        aria-label="Alternar menú lateral"
                        type="button"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="h-8 w-px bg-[var(--color-link)]/10 mx-1 hidden md:block" />

                    <button
                        onClick={() => {
                            // Detectar si estamos en vista de comentario
                            const isCommentary = window.location.pathname.includes('commentary');
                            const selector = isCommentary
                                ? '.reader-content h1, .reader-content .reader-text'
                                : '.reader-content h1, .reader-content p';

                            play(selector, handleAutoPlay);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            stop();
                        }}
                        className={`h-11 w-11 p-0 shrink-0 rounded-md transition-colors cursor-pointer flex items-center justify-center border-none ${isPlaying ? 'bg-[var(--surface-active-bg)] text-[var(--color-link)]' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] bg-transparent'}`}
                        style={{ padding: 0, width: '44px', height: '44px', minWidth: '44px' }}
                        aria-label={isPlaying ? (isPaused ? "Reanudar lectura" : "Pausar lectura") : "Leer en voz alta"}
                        type="button"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-[var(--color-link)] border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                            isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setView('books');
                            setIsOpen(true);
                        }}
                        className="h-11 w-11 p-0 shrink-0 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex items-center justify-center cursor-pointer bg-transparent border-none"
                        style={{ padding: 0, width: '44px', height: '44px', minWidth: '44px' }}
                        aria-label="Abrir navegación de libros"
                        type="button"
                    >
                        <BookSearch className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => {
                            setView('settings');
                            setIsOpen(true);
                        }}
                        className="h-11 w-11 p-0 shrink-0 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex items-center justify-center cursor-pointer bg-transparent border-none"
                        style={{ padding: 0, width: '44px', height: '44px', minWidth: '44px' }}
                        aria-label="Abrir configuración"
                        type="button"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            {/* Settings Sheet (Sidebar) */}
            {typeof document !== 'undefined' && createPortal(
                <div
                    ref={portalRef}
                    className={`fixed inset-0 ui-protect transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ top: '4rem', zIndex: 2147483647 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-[85%] sm:w-full sm:max-w-sm border-l border-theme-text/10 shadow-2xl transform transition-transform duration-300 flex flex-col ui-protect z-[2147483647] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    >

                        {/* Header */}
                        <div
                            className="flex items-center justify-between p-4 sm:p-6 border-b"
                            style={{ borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                        >
                            <div className="flex items-center gap-2">
                                {view === 'chapters' && (
                                    <div
                                        onClick={() => setView('books')}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setView('books');
                                            }
                                        }}
                                        className="mr-2 p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-all cursor-pointer"
                                    >
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </div>
                                )}
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {view === 'settings' && <><Settings className="w-5 h-5" /> Configuración</>}
                                    {view === 'books' && <>Libros</>}
                                    {view === 'chapters' && selectedBook?.name}
                                </h2>
                            </div>
                            <div
                                onClick={() => setIsOpen(false)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setIsOpen(false);
                                    }
                                }}
                                className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer"
                                aria-label="Cerrar panel"
                            >
                                <X className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">

                            {/* VIEW: SETTINGS */}
                            {view === 'settings' && (
                                <SettingsMenu
                                    voices={voices}
                                    selectedVoice={selectedVoice}
                                    setSelectedVoice={setSelectedVoice}
                                />
                            )}

                            {/* VIEW: BOOKS OR CHAPTERS */}
                            {(view === 'books' || view === 'chapters') && (
                                <BookNavigation
                                    view={view}
                                    setView={setView}
                                    searchQuery={searchQuery}
                                    handleSearchInput={handleSearchInput}
                                    isProjectMode={isProjectMode}
                                    setIsProjectMode={setIsProjectMode}
                                    isProjecting={isProjecting}
                                    clearProjection={clearProjection}
                                    openProjectionWindow={openProjectionWindow}
                                    suggestions={suggestions}
                                    applySuggestion={applySuggestion}
                                    handleSearch={handleSearch}
                                    otBooks={otBooks}
                                    ntBooks={ntBooks}
                                    expandedSections={expandedSections}
                                    toggleSection={toggleSection}
                                    selectedBook={selectedBook}
                                    setSelectedBook={setSelectedBook}
                                    setSearchQuery={setSearchQuery}
                                    navigateToChapter={navigateToChapter}
                                />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
