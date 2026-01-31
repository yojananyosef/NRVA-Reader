import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { preferences, type Theme, resetPreferences, type Preferences, PREFS_STORAGE_KEY, defaultPreferences } from '../../../stores/preferences';
import { Settings, Type, AlignJustify, MoveHorizontal, Palette, RotateCcw, X, Sun, Moon, BookOpen, Menu, ChevronRight, Ruler, Play, MessageSquare, Quote, Check, Pause, BookSearch } from 'lucide-preact';
import ReaderRuler from './ReaderRuler';
import { useTTS } from '../hooks/useTTS';

interface Book {
    code: string;
    name: string;
    chapters: number;
}

interface ReaderControlsProps {
    books?: Book[];
}

export default function ReaderControls({ books = [] }: ReaderControlsProps) {
    const $preferences = useStore(preferences);
    const [isOpen, setIsOpen] = useState(false);
    const { isPlaying, isPaused, isLoading, play, stop, setRate } = useTTS();

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

    // Reset view when closing
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('settings');
                setSelectedBook(null);
            }, 300);
        }
    }, [isOpen]);

    const navigateToChapter = (chapter: number) => {
        if (selectedBook) {
            const isCommentary = window.location.pathname.includes('/commentary');
            const baseUrl = isCommentary ? '/commentary' : '/';
            const url = `${baseUrl}?book=${selectedBook.code}&chapter=${chapter}`;

            // Si ya estamos en la misma página (Biblia o Comentario), navegar sin recargar
            const currentPath = window.location.pathname;
            if (currentPath === baseUrl || (currentPath === '/' && baseUrl === '/')) {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new CustomEvent('app:navigate', {
                    detail: { url, book: selectedBook.code, chapter: String(chapter) }
                }));
            } else {
                // Si cambiamos entre Biblia y Comentario, recarga normal (o dejar que View Transitions actúe)
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
                    <div
                        onClick={() => {
                            play('.reader-content p, .reader-content h1', handleAutoPlay);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            stop();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                play('.reader-content p, .reader-content h1', handleAutoPlay);
                            }
                        }}
                        className={`p-2 rounded-md transition-colors cursor-pointer flex items-center justify-center min-w-[40px] ${isPlaying ? 'bg-[var(--surface-active-bg)] text-[var(--color-link)]' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)]'}`}
                        aria-label={isPlaying ? (isPaused ? "Reanudar lectura" : "Pausar lectura") : "Leer en voz alta"}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-[var(--color-link)] border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                            isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </div>

                    <div
                        onClick={() => {
                            setView('books');
                            setIsOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setView('books');
                                setIsOpen(true);
                            }
                        }}
                        className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer"
                        aria-label="Abrir navegación de libros"
                    >
                        <BookSearch className="w-6 h-6" />
                    </div>

                    <div
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                            }
                        }}
                        className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex md:hidden items-center gap-2 cursor-pointer"
                        aria-label="Alternar menú lateral"
                    >
                        <Menu className="w-6 h-6" />
                    </div>
                    <div
                        onClick={() => {
                            setView('settings');
                            setIsOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setView('settings');
                                setIsOpen(true);
                            }
                        }}
                        className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer"
                        aria-label="Abrir configuración"
                    >
                        <Settings className="w-6 h-6" />
                    </div>
                </div>
            </nav>

            {/* Settings Sheet (Sidebar) */}
            <div className={`fixed inset-0 z-[60] ui-protect transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
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

                                    {/* Skip Options */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div
                                            onClick={() => update('skipVerses', !$preferences.skipVerses)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    update('skipVerses', !$preferences.skipVerses);
                                                }
                                            }}
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
                                        </div>
                                        <div
                                            onClick={() => update('skipFootnotes', !$preferences.skipFootnotes)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    update('skipFootnotes', !$preferences.skipFootnotes);
                                                }
                                            }}
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
                                        </div>
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
                                            <div
                                                key={theme.value}
                                                onClick={() => update('theme', theme.value as Theme)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        update('theme', theme.value as Theme);
                                                    }
                                                }}
                                                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                style={{
                                                    borderColor: $preferences.theme === theme.value ? 'var(--color-link)' : 'transparent',
                                                    backgroundColor: $preferences.theme === theme.value ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.theme === theme.value ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                <theme.icon className="w-5 h-5 mb-1" />
                                                <span className="text-xs font-medium">{theme.label}</span>
                                            </div>
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
                                        <div
                                            onClick={() => update('fontFamily', 'sans')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    update('fontFamily', 'sans');
                                                }
                                            }}
                                            className="p-3 rounded-lg border-2 transition-all font-sans cursor-pointer text-center"
                                            style={{
                                                borderColor: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'transparent',
                                                backgroundColor: $preferences.fontFamily === 'sans' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            Arial
                                        </div>
                                        <div
                                            onClick={() => update('fontFamily', 'dyslexic')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    update('fontFamily', 'dyslexic');
                                                }
                                            }}
                                            className="p-3 rounded-lg border-2 transition-all font-dyslexic cursor-pointer text-center"
                                            style={{
                                                borderColor: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'transparent',
                                                backgroundColor: $preferences.fontFamily === 'dyslexic' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            OpenDyslexic
                                        </div>
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
                            <div className="space-y-2">
                                {books.map((book) => (
                                    <div
                                        key={book.code}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            setView('chapters');
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setSelectedBook(book);
                                                setView('chapters');
                                            }
                                        }}
                                        className="w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors cursor-pointer"
                                        style={{ backgroundColor: 'transparent' }}
                                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                                    >
                                        <span className="font-medium">{book.name}</span>
                                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-60" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* VIEW: CHAPTERS */}
                        {view === 'chapters' && selectedBook && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                                    <div
                                        key={chapter}
                                        onClick={() => navigateToChapter(chapter)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                navigateToChapter(chapter);
                                            }
                                        }}
                                        className="p-3 rounded-lg font-medium text-center transition-colors cursor-pointer"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)' }}
                                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 90%)'}
                                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                                    >
                                        {chapter}
                                    </div>
                                ))}
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
                            <div
                                onClick={resetPreferences}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        resetPreferences();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                                style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Restaurar valores
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
