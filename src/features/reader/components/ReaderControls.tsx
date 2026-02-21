import { useStore } from '@nanostores/preact';
import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { preferences, type Theme, resetPreferences, type Preferences, PREFS_STORAGE_KEY, defaultPreferences } from '../../../stores/preferences';
import { Settings, Type, AlignJustify, MoveHorizontal, Palette, RotateCcw, X, Sun, Moon, BookOpen, Menu, ChevronRight, Ruler, Play, MessageSquare, Quote, Check, Pause, BookSearch, Search, Monitor, MonitorOff } from 'lucide-preact';
import ReaderRuler from './ReaderRuler';
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
                const elements = document.querySelectorAll('.reader-content p, .reader-content h1');
                if (elements.length > 0) {
                    play('.reader-content p, .reader-content h1', handleAutoPlay);
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

    const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        // Optimistic update
        const newPrefs: Preferences = { ...$preferences, [key]: value } as Preferences;
        preferences.set(newPrefs);

        // Storage is handled by store subscription, but we can force it if needed
        // applyThemeToDocument is handled by init-client script subscription
    };

    const [view, setView] = useState<'settings' | 'books' | 'chapters'>('settings');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['at']);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Book[]>([]);

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
                className="w-full h-16 border-b flex items-center justify-between px-4 md:px-8 transition-colors duration-300 ui-protect"
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
                            play('.reader-content p, .reader-content h1', handleAutoPlay);
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
                    className={`fixed inset-0 ui-protect transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ top: '4rem', zIndex: 9999 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-[85%] sm:w-full sm:max-w-sm border-l border-theme-text/10 shadow-2xl transform transition-transform duration-300 flex flex-col ui-protect ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                                <div className="space-y-8">
                                    {/* Accessibility Tools */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                            <Ruler className="w-4 h-4" />
                                            <label>Herramientas de Lectura</label>
                                        </div>

                                        {/* Ruler Toggle */}
                                        <div
                                            className="flex items-center justify-between p-3 rounded-lg border surface-card"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Ruler className="w-5 h-5 opacity-60" />
                                                <span className="font-medium text-sm">Guía de Lectura</span>
                                            </div>
                                            <div
                                                onClick={() => update('rulerEnabled', !$preferences.rulerEnabled)}
                                                role="switch"
                                                aria-checked={$preferences.rulerEnabled}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        update('rulerEnabled', !$preferences.rulerEnabled);
                                                    }
                                                }}
                                                className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner cursor-pointer"
                                                style={{
                                                    backgroundColor: $preferences.rulerEnabled ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 75%)',
                                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <div
                                                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${$preferences.rulerEnabled ? 'left-[22px]' : 'left-0.5'}`}
                                                    style={{
                                                        backgroundColor: 'var(--color-bg)',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Red Letters Toggle */}
                                        <div
                                            className="flex items-center justify-between p-3 rounded-lg border surface-card"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Quote className="w-5 h-5 text-red-500 opacity-80" />
                                                <span className="font-medium text-sm">Palabras de Jesús en Rojo</span>
                                            </div>
                                            <div
                                                onClick={() => update('showRedLetters', !$preferences.showRedLetters)}
                                                role="switch"
                                                aria-checked={$preferences.showRedLetters}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        update('showRedLetters', !$preferences.showRedLetters);
                                                    }
                                                }}
                                                className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner cursor-pointer"
                                                style={{
                                                    backgroundColor: $preferences.showRedLetters ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 75%)',
                                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <div
                                                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${$preferences.showRedLetters ? 'left-[22px]' : 'left-0.5'}`}
                                                    style={{
                                                        backgroundColor: 'var(--color-bg)',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Audio Speed */}
                                        <div className="space-y-2 p-3 rounded-lg border surface-card">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Play className="w-5 h-5 opacity-60" style={{ color: 'var(--color-text)' }} />
                                                    <span className="font-medium text-sm">Velocidad de Voz</span>
                                                </div>
                                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-muted-border)', fontSize: '12px' }}>x{$preferences.speechRate}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={$preferences.speechRate}
                                                onInput={(e) => update('speechRate', Number((e.target as HTMLInputElement).value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                                style={{ backgroundColor: 'var(--surface-muted-border)', height: '8px' }}
                                            />
                                        </div>

                                        {/* Voice Selection */}
                                        <div className="space-y-2 p-3 rounded-lg border surface-card">
                                            <div className="flex items-center gap-3 mb-2">
                                                <MessageSquare className="w-5 h-5 opacity-60" style={{ color: 'var(--color-text)' }} />
                                                <span className="font-medium text-sm">Voz de Lectura</span>
                                            </div>
                                            <select
                                                value={selectedVoice?.voiceURI || ''}
                                                onChange={(e) => {
                                                    const uri = (e.currentTarget as HTMLSelectElement).value;
                                                    const voice = voices.find(v => v.voiceURI === uri) || null;
                                                    setSelectedVoice(voice);
                                                }}
                                                className="w-full p-2 rounded-md border text-sm bg-[var(--surface-muted-bg)] cursor-pointer hover:border-[var(--color-link)] transition-colors"
                                                style={{
                                                    borderColor: 'var(--surface-muted-border)',
                                                    color: 'var(--color-text)',
                                                    outline: 'none'
                                                }}
                                                disabled={voices.length === 0}
                                            >
                                                {voices.length === 0 && <option value="">Cargando voces...</option>}
                                                {voices.map((voice, idx) => (
                                                    <option key={`${voice.voiceURI}-${idx}`} value={voice.voiceURI}>
                                                        {voice.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Skip Options */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => update('skipVerses', !$preferences.skipVerses)}
                                                className="p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                                                style={{
                                                    borderColor: $preferences.skipVerses ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                                    backgroundColor: $preferences.skipVerses ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.skipVerses ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Quote className="w-5 h-5" />
                                                    {$preferences.skipVerses && <Check className="w-4 h-4" />}
                                                </div>
                                                <span className="text-xs font-medium">Saltar Versos</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => update('skipFootnotes', !$preferences.skipFootnotes)}
                                                className="p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                                                style={{
                                                    borderColor: $preferences.skipFootnotes ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                                    backgroundColor: $preferences.skipFootnotes ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.skipFootnotes ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="w-5 h-5" />
                                                    {$preferences.skipFootnotes && <Check className="w-4 h-4" />}
                                                </div>
                                                <span className="text-xs font-medium">Saltar Notas</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-[var(--color-text)] opacity-10 my-4" />

                                    {/* Theme */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                            <Palette className="w-4 h-4" />
                                            <label>Tema</label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'light', label: 'Claro', icon: Sun },
                                                { value: 'dark', label: 'Oscuro', icon: Moon },
                                                { value: 'sepia', label: 'Sepia', icon: BookOpen },
                                            ].map((theme) => (
                                                <button
                                                    type="button"
                                                    key={theme.value}
                                                    onClick={() => update('theme', theme.value as Theme)}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                    style={{
                                                        borderColor: $preferences.theme === theme.value ? 'var(--color-link)' : 'transparent',
                                                        backgroundColor: $preferences.theme === theme.value ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                        color: $preferences.theme === theme.value ? 'var(--color-link)' : 'var(--color-text)'
                                                    }}
                                                >
                                                    <theme.icon className="w-5 h-5 mb-1" />
                                                    <span className="text-xs font-medium">{theme.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Font Family */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                            <Type className="w-4 h-4" />
                                            <label>Fuente</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => update('fontFamily', 'sans')}
                                                className="p-3 rounded-lg border-2 transition-all font-sans cursor-pointer text-center"
                                                style={{
                                                    borderColor: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'transparent',
                                                    backgroundColor: $preferences.fontFamily === 'sans' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                Arial
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => update('fontFamily', 'dyslexic')}
                                                className="p-3 rounded-lg border-2 transition-all font-dyslexic cursor-pointer text-center"
                                                style={{
                                                    borderColor: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'transparent',
                                                    backgroundColor: $preferences.fontFamily === 'dyslexic' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                OpenDyslexic
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-theme-text/10 my-4" />

                                    {/* Sliders Section */}
                                    <div className="space-y-6">
                                        {/* Font Size */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                                <div className="flex items-center gap-2">
                                                    <Type className="w-4 h-4" />
                                                    <label>Tamaño</label>
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)', fontSize: '12px' }}>{$preferences.fontSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="14"
                                                max="32"
                                                value={$preferences.fontSize}
                                                onInput={(e) => update('fontSize', Number((e.target as HTMLInputElement).value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)', height: '8px' }}
                                            />
                                        </div>

                                        {/* Line Height */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                                <div className="flex items-center gap-2">
                                                    <AlignJustify className="w-4 h-4" />
                                                    <label>Interlineado</label>
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.lineHeight}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1.2"
                                                max="2.5"
                                                step="0.1"
                                                value={$preferences.lineHeight}
                                                onInput={(e) => update('lineHeight', Number((e.target as HTMLInputElement).value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                                            />
                                        </div>

                                        {/* Letter Spacing */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                                <div className="flex items-center gap-2">
                                                    <MoveHorizontal className="w-4 h-4" />
                                                    <label>Espaciado</label>
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.letterSpacing}em</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="0.1"
                                                step="0.01"
                                                value={$preferences.letterSpacing}
                                                onInput={(e) => update('letterSpacing', Number((e.target as HTMLInputElement).value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VIEW: BOOKS */}
                            {view === 'books' && (
                                <div className="space-y-6">
                                    {/* Bible Search System */}
                                    <form onSubmit={handleSearch} className="mb-6 space-y-4">
                                        <div className="flex gap-2">
                                            <div className="relative group flex-1">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Search className="w-4 h-4 opacity-50 group-focus-within:text-[var(--color-link)] group-focus-within:opacity-100 transition-all" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onInput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
                                                    placeholder={isProjectMode ? "Proyectar versículo (ej. Juan 3:16)" : "Buscar..."}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[var(--color-link)] outline-none"
                                                    style={{
                                                        backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                        borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)'
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isProjecting && isProjectMode) {
                                                        clearProjection();
                                                    } else {
                                                        setIsProjectMode(!isProjectMode);
                                                    }
                                                }}
                                                className={`hidden md:flex p-3 rounded-xl border transition-all items-center justify-center ${isProjectMode ? 'bg-[var(--color-link)] text-white' : 'hover:bg-[var(--surface-hover-bg)]'}`}
                                                title={isProjectMode ? "Modo Proyección Activado" : "Activar Modo Proyección"}
                                            >
                                                {isProjectMode ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5 opacity-50" />}
                                            </button>
                                        </div>

                                        {isProjectMode && (
                                            <div className="space-y-2 hidden md:block">
                                                <div className="text-xs px-3 py-2 rounded-lg bg-[var(--color-link)]/10 text-[var(--color-link)] border border-[var(--color-link)]/20 flex items-center gap-2">
                                                    <Monitor className="w-3 h-3" />
                                                    <span>Modo Proyección: Busca un versículo para mostrarlo.</span>
                                                </div>
                                                {!isProjecting && (
                                                    <button
                                                        type="button"
                                                        onClick={openProjectionWindow}
                                                        className="w-full text-xs py-2 rounded-lg border border-[var(--color-link)] text-[var(--color-link)] hover:bg-[var(--color-link)]/10 transition-colors flex items-center justify-center gap-2 font-medium"
                                                    >
                                                        <Monitor className="w-3 h-3" />
                                                        Abrir Ventana de Proyección
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Sugerencias Autocomplete */}
                                        {suggestions.length > 0 && (
                                            <div
                                                className="mt-2 rounded-xl border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 relative"
                                                style={{
                                                    backgroundColor: 'var(--color-bg)',
                                                    borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)'
                                                }}
                                            >
                                                {suggestions.map((book) => (
                                                    <div
                                                        key={book.code}
                                                        onClick={() => applySuggestion(book.name)}
                                                        className="px-4 py-3 text-sm cursor-pointer hover:bg-[var(--color-link)] hover:text-white transition-colors flex items-center justify-between group"
                                                    >
                                                        <span className="font-medium">{book.name}</span>
                                                        <span className="text-[10px] opacity-50 group-hover:opacity-100 uppercase tracking-tighter">{book.code}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </form>

                                    {/* Antiguo Testamento */}
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('at')}
                                            className="flex w-full items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-hover-bg)] transition-colors cursor-pointer border border-transparent"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)' }}
                                        >
                                            <span className="font-bold text-sm uppercase tracking-wider">Antiguo Testamento</span>
                                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expandedSections.includes('at') ? 'rotate-90' : ''}`} />
                                        </button>
                                        {expandedSections.includes('at') && (
                                            <div className="grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {otBooks.map((book) => (
                                                    <button
                                                        type="button"
                                                        key={book.code}
                                                        onClick={() => {
                                                            setSelectedBook(book);
                                                            setView('chapters');
                                                        }}
                                                        className="w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors cursor-pointer hover:bg-[var(--surface-hover-bg)]"
                                                    >
                                                        <span className="font-medium">{book.name}</span>
                                                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-60" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Nuevo Testamento */}
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('nt')}
                                            className="flex w-full items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-hover-bg)] transition-colors cursor-pointer border border-transparent"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)' }}
                                        >
                                            <span className="font-bold text-sm uppercase tracking-wider">Nuevo Testamento</span>
                                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expandedSections.includes('nt') ? 'rotate-90' : ''}`} />
                                        </button>
                                        {expandedSections.includes('nt') && (
                                            <div className="grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {ntBooks.map((book) => (
                                                    <button
                                                        type="button"
                                                        key={book.code}
                                                        onClick={() => {
                                                            setSelectedBook(book);
                                                            setView('chapters');
                                                        }}
                                                        className="w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors cursor-pointer hover:bg-[var(--surface-hover-bg)]"
                                                    >
                                                        <span className="font-medium">{book.name}</span>
                                                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-60" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: CHAPTERS */}
                            {view === 'chapters' && selectedBook && (
                                <div className="space-y-4">
                                    {isProjectMode && (
                                        <div className="text-xs px-3 py-2 rounded-lg bg-[var(--color-link)]/10 text-[var(--color-link)] border border-[var(--color-link)]/20 hidden md:flex items-center gap-2">
                                            <Monitor className="w-3 h-3" />
                                            <span>Selecciona un capítulo para proyectar el versículo 1 (por defecto) o buscar.</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                        {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                                            <button
                                                type="button"
                                                key={chapter}
                                                onClick={() => {
                                                    if (isProjectMode) {
                                                        // En modo proyección, al seleccionar capítulo, podríamos:
                                                        // 1. Proyectar el capítulo 1:1
                                                        // 2. O simplemente navegar ahí para que el usuario seleccione el versículo después (pero eso requiere UI de versículos aquí)
                                                        // Para simplificar, autocompletamos la búsqueda con "Libro Capitulo"
                                                        setSearchQuery(`${selectedBook.name} ${chapter}:1`);
                                                        setView('books'); // Volver a la búsqueda
                                                        // Opcionalmente auto-buscar
                                                    } else {
                                                        navigateToChapter(chapter);
                                                    }
                                                }}
                                                className="p-3 rounded-lg font-medium text-center transition-colors cursor-pointer"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)' }}
                                                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 90%)'}
                                                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                                            >
                                                {chapter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer - Only settings */}
                        {view === 'settings' && (
                            <div
                                className="p-6 border-t"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                    backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={resetPreferences}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                                    style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Restaurar valores
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
