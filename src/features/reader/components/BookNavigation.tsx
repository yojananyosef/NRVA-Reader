import { Search, Monitor, MonitorOff, ChevronRight } from 'lucide-preact';

interface Book {
    code: string;
    name: string;
    chapters: number;
    section?: string;
}

interface BookNavigationProps {
    view: 'books' | 'chapters';
    setView: (view: 'settings' | 'books' | 'chapters') => void;
    searchQuery: string;
    handleSearchInput: (val: string) => void;
    isProjectMode: boolean;
    setIsProjectMode: (val: boolean) => void;
    isProjecting: boolean;
    clearProjection: () => void;
    openProjectionWindow: () => void;
    suggestions: Book[];
    applySuggestion: (bookName: string) => void;
    handleSearch: (e: any) => void;
    otBooks: Book[];
    ntBooks: Book[];
    expandedSections: string[];
    toggleSection: (section: string) => void;
    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;
    setSearchQuery: (query: string) => void;
    navigateToChapter: (chapter: number) => void;
}

export default function BookNavigation({
    view,
    setView,
    searchQuery,
    handleSearchInput,
    isProjectMode,
    setIsProjectMode,
    isProjecting,
    clearProjection,
    openProjectionWindow,
    suggestions,
    applySuggestion,
    handleSearch,
    otBooks,
    ntBooks,
    expandedSections,
    toggleSection,
    selectedBook,
    setSelectedBook,
    setSearchQuery,
    navigateToChapter
}: BookNavigationProps) {
    if (view === 'books') {
        return (
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
        );
    }

    if (view === 'chapters' && selectedBook) {
        return (
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
                                    setSearchQuery(`${selectedBook.name} ${chapter}:1`);
                                    setView('books');
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
        );
    }

    return null;
}
