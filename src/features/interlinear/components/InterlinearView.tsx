import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { Info, ChevronDown, Book, Hash, Check } from "lucide-preact";
import booksIndex from "../../../data/books-index.json";
import { useStore } from "@nanostores/preact";
import { preferences } from "../../../stores/preferences";
import ArrowNavigation from "../../../components/common/ArrowNavigation";
import { useInterlinearParams, useInterlinearData } from "../../../application/interlinear/hooks/useInterlinear";

export default function InterlinearView() {
  const $preferences = useStore(preferences);

  // 1. Gestión de Parámetros (Application Hook)
  const { params, setParams, updateUrl } = useInterlinearParams();
  const { book: bookCode, chapter, verse } = params;

  // 2. Gestión de Datos (Application Hook)
  const { interlinearData, currentBibleVerse, loading, error } = useInterlinearData(bookCode, chapter, verse);

  const chapterData = useMemo(() => {
    if (!interlinearData) return [];
    return interlinearData.filter(v => v.chapter === parseInt(chapter));
  }, [interlinearData, chapter]);

  // Encontrar el versículo específico
  const verseData = useMemo(() => {
    if (!interlinearData) return null;
    // Filtrar solo los versículos del capítulo actual
    const chapterVerses = interlinearData.filter(v => v.chapter === parseInt(chapter));
    return chapterVerses.find(v => v.verse === parseInt(verse)) || null;
  }, [interlinearData, chapter, verse]);

  const hasPrevVerse = parseInt(verse) > 1 || parseInt(chapter) > 1;
  const hasNextVerse = true;

  const navigateVerse = (direction: number) => {
    const v = parseInt(verse);
    const c = parseInt(chapter);
    if (direction === -1) {
      if (v > 1) updateUrl({ verse: (v - 1).toString() });
      else if (c > 1) updateUrl({ chapter: (c - 1).toString(), verse: "1" });
    } else {
      updateUrl({ verse: (v + 1).toString() });
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Estado local para UI de selectores (Presentation Logic)
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [isVerseOpen, setIsVerseOpen] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  const books = useMemo(() => booksIndex, []);
  const currentBook = useMemo(() => books.find(b => b.code === bookCode), [bookCode, books]);
  const chapterInt = parseInt(chapter);
  const verseInt = parseInt(verse);

  // Handlers de UI
  const handleBookChange = (code: string) => {
    updateUrl({ book: code, chapter: "1", verse: "1" });
    setIsBookOpen(false);
  };

  const handleChapterChange = (newChapter: string) => {
    updateUrl({ chapter: newChapter, verse: "1" });
    setIsChapterOpen(false);
  };

  const handleVerseChange = (newVerse: string) => {
    updateUrl({ verse: newVerse });
    setIsVerseOpen(false);
  };

  const handlePrevVerse = () => {
    if (verseInt > 1) {
      updateUrl({ verse: (verseInt - 1).toString() });
    } else if (chapterInt > 1) {
      updateUrl({ chapter: (chapterInt - 1).toString(), verse: "1" });
    }
  };

  const handleNextVerse = () => {
    updateUrl({ verse: (verseInt + 1).toString() });
  };

  // Cerrar selectores al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bookRef.current && !bookRef.current.contains(event.target as Node)) setIsBookOpen(false);
      if (chapterRef.current && !chapterRef.current.contains(event.target as Node)) setIsChapterOpen(false);
      if (verseRef.current && !verseRef.current.contains(event.target as Node)) setIsVerseOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--color-link) color-mix(in srgb, var(--color-text), transparent 95%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: color-mix(in srgb, var(--color-text), transparent 95%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--color-link);
          border-radius: 10px;
        }
        .dropdown-content {
          max-height: 280px !important;
          overflow-y: auto !important;
          background-color: var(--color-bg) !important;
          backdrop-filter: blur(8px);
          border: 1px solid color-mix(in srgb, var(--color-text), transparent 85%) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      <header className="text-center space-y-2 ui-protect">
        <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-link)] opacity-60">
          {currentBook?.section === 'at' ? 'Antiguo Testamento Interlineal' : 'Nuevo Testamento Interlineal'}
        </h1>
      </header>

      {/* Selectores Custom */}
      <div className="flex flex-wrap items-center justify-center gap-3 p-2 rounded-2xl bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] max-w-fit mx-auto relative z-50 shadow-sm transition-colors duration-300 ui-protect">
        {/* Book Selector */}
        <div className="relative" ref={bookRef}>
          <button
            onClick={() => { setIsBookOpen(!isBookOpen); setIsChapterOpen(false); setIsVerseOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border text-sm ui-protect ${isBookOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] border-[var(--surface-muted-border)] shadow-sm'}`}
          >
            <div className={`p-1 rounded-lg ${isBookOpen ? 'bg-white/20' : 'bg-[var(--color-link)]/10 text-[var(--color-link)]'}`}>
              <Book className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold truncate max-w-[120px]">
              {currentBook?.name}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBookOpen ? 'rotate-180' : ''}`} />
          </button>

          {isBookOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 dropdown-content rounded-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar z-[60] ui-protect">
              <div className="grid grid-cols-1 gap-0.5">
                {books.map(b => (
                  <button
                    key={b.code}
                    onClick={() => handleBookChange(b.code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ui-protect ${b.code === params.book ? 'bg-[var(--color-link)]/10 text-[var(--color-link)] font-bold' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                  >
                    <span>{b.name}</span>
                    {b.code === params.book && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-theme-text/10 hidden sm:block" />

        {/* Chapter Selector */}
        <div className="relative" ref={chapterRef}>
          <button
            onClick={() => { setIsChapterOpen(!isChapterOpen); setIsBookOpen(false); setIsVerseOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border text-sm ui-protect ${isChapterOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] border-[var(--surface-muted-border)] shadow-sm'}`}
          >
            <div className={`p-1 rounded-lg ${isChapterOpen ? 'bg-white/20' : 'bg-[var(--color-link)]/10 text-[var(--color-link)]'}`}>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">{params.chapter}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isChapterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isChapterOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 dropdown-content rounded-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar z-[60] ui-protect">
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: currentBook?.chapters || 1 }, (_, i) => String(i + 1)).map(num => (
                  <button
                    key={num}
                    onClick={() => handleChapterChange(num)}
                    className={`flex items-center justify-center aspect-square rounded-lg text-xs transition-colors ui-protect ${num === params.chapter ? 'bg-[var(--color-link)] text-white font-bold' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-theme-text/10 hidden sm:block" />

        {/* Verse Selector */}
        <div className="relative" ref={verseRef}>
          <button
            onClick={() => { setIsVerseOpen(!isVerseOpen); setIsBookOpen(false); setIsChapterOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border text-sm ui-protect ${isVerseOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-theme-text/5 text-[var(--color-text)] border-theme-text/10 shadow-sm'}`}
          >
            <div className={`p-1 rounded-lg ${isVerseOpen ? 'bg-white/20' : 'bg-[var(--color-link)]/10 text-[var(--color-link)]'}`}>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">{params.verse}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isVerseOpen ? 'rotate-180' : ''}`} />
          </button>

          {isVerseOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 dropdown-content rounded-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar z-[60] ui-protect">
              <div className="grid grid-cols-4 gap-1">
                {(chapterData.length > 0 ? chapterData.map(v => String(v.verse)) : [params.verse]).map(num => (
                  <button
                    key={num}
                    onClick={() => handleVerseChange(num)}
                    className={`flex items-center justify-center aspect-square rounded-lg text-xs transition-colors ui-protect ${num === params.verse ? 'bg-[var(--color-link)] text-white font-bold' : 'hover:bg-theme-text/5 text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de navegación fijos (estilo Biblia/Comentario) */}
      <ArrowNavigation
        onPrev={hasPrevVerse ? () => navigateVerse(-1) : undefined}
        onNext={hasNextVerse ? () => navigateVerse(1) : undefined}
        prevLabel="Versículo anterior"
        nextLabel="Siguiente versículo"
      />

      {/* Área Interlineal */}
      <div
        className="relative border rounded-3xl p-6 sm:p-10 min-h-[450px] flex flex-col shadow-sm transition-all duration-300"
        style={{
          backgroundColor: 'var(--surface-muted-bg)',
          color: 'var(--color-text)',
          borderColor: 'var(--surface-muted-border)'
        }}
      >

        <div className="flex items-center justify-center mb-10">
          <div className="text-center group cursor-default">
            <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
              {currentBook?.name} <span className="text-[var(--color-link)]">{params.chapter}:{params.verse}</span>
            </h2>
            <div className="h-1 w-8 bg-[var(--color-link)] mx-auto mt-1 rounded-full opacity-30 group-hover:w-16 transition-all duration-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-[var(--color-link)]/10 border-t-[var(--color-link)] rounded-full animate-spin"></div>
              <div className="animate-pulse text-lg opacity-40 font-bold tracking-widest uppercase text-xs">
                Cargando {currentBook?.section === 'at' ? 'Hebreo' : 'Griego'}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 ui-protect">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 rotate-3 ui-protect">
              <Info className="w-10 h-10" />
            </div>
            <div className="space-y-2 ui-protect">
              <h3 className="text-xl font-black">Datos no disponibles</h3>
              <p className="opacity-50 max-w-sm text-sm leading-relaxed">
                Lo sentimos, no pudimos localizar los datos interlineales para esta selección.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[var(--color-link)] text-white rounded-2xl font-bold shadow-lg shadow-[var(--color-link)]/20 hover:scale-105 transition-transform ui-protect"
            >
              Reintentar carga
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div
              className="flex flex-wrap justify-start gap-x-8 gap-y-16 mb-16 py-8 interlinear-words-container"
              dir={currentBook?.section === 'at' ? 'rtl' : 'ltr'}
            >
              {verseData?.words.map((word, idx) => (
                <div key={idx} className="flex flex-col items-center group relative min-w-[70px]">
                  {/* Parsing Tooltip */}
                  <div className="absolute -top-10 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 translate-y-2 group-hover:translate-y-0 ui-protect">
                    <span className="text-[10px] font-bold bg-[var(--color-text)] text-[var(--color-bg)] px-2 py-1 rounded-lg shadow-xl whitespace-nowrap ui-protect">
                      {word.parsing}
                    </span>
                    <div className="w-2 h-2 bg-[var(--color-text)] rotate-45 -mt-1 ui-protect" />
                  </div>

                  {word.strong && (
                    <a
                      href={`/strong/${currentBook?.section === 'at' ? 'H' : 'G'}${word.strong}`}
                      className="text-[11px] opacity-60 hover:opacity-100 hover:text-[var(--color-link)] transition-all absolute -top-5 font-bold tracking-tighter ui-protect"
                      title={`Lexicón: ${currentBook?.section === 'at' ? 'H' : 'G'}${word.strong}`}
                      data-astro-prefetch
                    >
                      {word.strong}
                    </a>
                  )}

                  <span
                    className={`${currentBook?.section === 'at' ? 'font-hebrew' : 'font-serif'} text-[var(--color-text)] leading-relaxed mb-4 hover:text-[var(--color-link)] transition-colors cursor-default select-none drop-shadow-sm`}
                    dir={currentBook?.section === 'at' ? 'rtl' : 'ltr'}
                    style={{ fontSize: `clamp(32px, ${$preferences.fontSize * 2}px, 64px)` }}
                  >
                    {word.hebrew || word.hebrew_aramaic || word.greek}
                  </span>

                  <span
                    className="font-bold opacity-60 text-center max-w-[140px] leading-tight group-hover:opacity-100 transition-opacity"
                    dir="ltr"
                    style={{ fontSize: `clamp(12px, ${$preferences.fontSize * 0.7}px, 20px)` }}
                  >
                    {word.spanish}
                  </span>
                </div>
              ))}
            </div>

            {/* Traducción de referencia en español */}
            {currentBibleVerse && (
              <div className="mt-auto mb-8 p-6 sm:p-8 rounded-3xl bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] flex gap-5 items-start animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="p-3 rounded-2xl bg-[var(--color-link)]/10 text-[var(--color-link)] shadow-inner ui-protect flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-2 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-link)] opacity-50 ui-protect">Versión Biblia Libre</span>
                  <p
                    className="leading-relaxed font-medium italic opacity-80 reader-text"
                    style={{
                      fontSize: `clamp(16px, ${$preferences.fontSize * 1.1}px, 28px)`,
                      /* Eliminamos line-height y letter-spacing inline para que mande el CSS con clamp */
                    }}
                    dangerouslySetInnerHTML={{
                      __html: $preferences.showRedLetters
                        ? currentBibleVerse.text
                        : currentBibleVerse.text.replace(/<span class="red-letter">/g, '').replace(/<\/span>/g, '')
                    }}
                  />
                </div>
              </div>
            )}
            {!currentBibleVerse && !loading && (
              <div className="mt-auto mb-8 p-6 text-center border-2 border-dashed border-theme-text/10 rounded-3xl opacity-30 text-sm font-medium italic">
                Traducción de referencia no disponible para este versículo.
              </div>
            )}

            {/* Pie de página */}
            <div className="pt-8 border-t border-theme-text/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-30">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                <span>Explora la morfología pasando el cursor</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{currentBook?.section === 'at' ? 'Biblia Hebraica' : 'Nuevo Testamento Griego'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
