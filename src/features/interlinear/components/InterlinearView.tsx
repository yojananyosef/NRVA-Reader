import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { Info, ChevronDown, Book, Hash, Check } from "lucide-preact";
import type { InterlinearVerse, InterlinearData } from "../types";
import booksIndex from "../../../data/books-index.json";
import { lastInterlinearPosition } from "../../../stores/navigation";
import { useStore } from "@nanostores/preact";
import { preferences } from "../../../stores/preferences";
import { fetchWithCache } from "../../../utils/fetchWithCache";
import ArrowNavigation from "../../../components/common/ArrowNavigation";
import { formatRedLetters } from "../../../utils/redLetterUtils";

const bookMapping: Record<string, string> = {
  gen: "genesis",
  exo: "exodus",
  lev: "leviticus",
  num: "numbers",
  deu: "deuteronomy",
  jos: "joshua",
  jdg: "judges",
  rut: "ruth",
  "1sa": "1_samuel",
  "2sa": "2_samuel",
  "1ki": "1_kings",
  "2ki": "2_kings",
  "1ch": "1_chronicles",
  "2ch": "2_chronicles",
  ezr: "ezra",
  neh: "nehemiah",
  est: "esther",
  job: "job",
  psa: "psalms",
  pro: "proverbs",
  ecc: "ecclesiastes",
  sol: "song_of_songs",
  isa: "isaiah",
  jer: "jeremiah",
  lam: "lamentations",
  eze: "ezekiel",
  dan: "daniel",
  hos: "hosea",
  joe: "joel",
  amo: "amos",
  oba: "obadiah",
  jon: "jonah",
  mic: "micah",
  nah: "nahum",
  hab: "habakkuk",
  zep: "zephaniah",
  hag: "haggai",
  zec: "zechariah",
  mal: "malachi",
  // New Testament
  mat: "matthew",
  mrk: "mark",
  luk: "luke",
  jhn: "john",
  act: "acts",
  rom: "romans",
  "1co": "1-corinthians",
  "2co": "2-corinthians",
  gal: "galatians",
  eph: "ephesians",
  phi: "philippians",
  col: "colossians",
  "1th": "1-thessalonians",
  "2th": "2-thessalonians",
  "1ti": "1-timothy",
  "2ti": "2-timothy",
  tit: "titus",
  phm: "philemon",
  heb: "hebrews",
  jam: "james",
  "1pe": "1-peter",
  "2pe": "2-peter",
  "1jo": "1-john",
  "2jo": "2-john",
  "3jo": "3-john",
  jud: "jude",
  rev: "revelation",
};

export default function InterlinearView() {
  const $preferences = useStore(preferences);
  const [params, setParams] = useState(() => {
    if (typeof window === "undefined") return { book: "gen", chapter: "1", verse: "1" };
    const searchParams = new URLSearchParams(window.location.search);

    // Si no hay parámetros en la URL, intentar cargar de localStorage
    if (!searchParams.get("book")) {
      try {
        const stored = localStorage.getItem('interlinear-last-position');
        if (stored) {
          const { lastBook, lastChapter, lastVerse } = JSON.parse(stored);
          if (lastBook && lastChapter) {
            return { book: lastBook, chapter: lastChapter, verse: lastVerse || "1" };
          }
        }
      } catch (e) { }
    }

    return {
      book: searchParams.get("book") || "gen",
      chapter: searchParams.get("chapter") || "1",
      verse: searchParams.get("verse") || "1"
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<InterlinearVerse[]>([]);
  const [verseData, setVerseData] = useState<InterlinearVerse | null>(null);
  const [bookData, setBookData] = useState<any>(null);

  // Estados para los selectores custom
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [isVerseOpen, setIsVerseOpen] = useState(false);

  const bookRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  const books = useMemo(() => booksIndex, []);
  const currentBook = useMemo(() => books.find(b => b.code === params.book), [params.book, books]);

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

  // Cargar datos del libro (español)
  useEffect(() => {
    let isMounted = true;
    async function loadSpanishBook() {
      if (!params.book) return;
      try {
        const data = await fetchWithCache<any>(`/data/books/${params.book}.json`);
        if (isMounted) {
          setBookData(data);
        }
      } catch (err) {
        console.error("Error loading spanish book:", err);
        if (isMounted) setBookData(null);
      }
    }
    loadSpanishBook();
    return () => { isMounted = false; };
  }, [params.book]);

  const spanishVerse = useMemo(() => {
    if (!bookData || !params.chapter || !params.verse) return null;

    const chapterData = bookData.capitulo || bookData.capitulos;
    if (!chapterData) return null;

    const chapter = chapterData[params.chapter];
    if (!chapter) return null;

    const content = chapter[params.verse];
    if (!content) return null;

    if (typeof content === "string") return content;
    if (typeof content === "object") return content.texto || content.text || null;
    return null;
  }, [bookData, params.chapter, params.verse]);

  // Actualizar URL cuando cambian los parámetros
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("book", params.book);
    url.searchParams.set("chapter", params.chapter);
    url.searchParams.set("verse", params.verse);
    window.history.replaceState({}, "", url.toString());

    // Guardar última posición
    lastInterlinearPosition.set({
      lastBook: params.book,
      lastChapter: params.chapter,
      lastVerse: params.verse
    });
  }, [params.book, params.chapter, params.verse]);

  const [interlinearData, setInterlinearData] = useState<InterlinearData | null>(null);

  // Cargar datos del libro interlineal completo (solo cuando cambia el libro)
  useEffect(() => {
    let isMounted = true;
    const fetchBookData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fileName = bookMapping[params.book] || params.book;
        const subDir = currentBook?.section === 'at' ? 'hebrew' : 'greek';
        const data: InterlinearData = await fetchWithCache<any>(`/data/bible/${subDir}/${fileName}.json`);

        if (isMounted) {
          setInterlinearData(data);
        }
      } catch (err: any) {
        console.error("Error loading interlinear data:", err);
        if (isMounted) {
          setError(err.message);
          setInterlinearData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookData();
    return () => { isMounted = false; };
  }, [params.book]);

  // Actualizar datos del capítulo cuando cambian los parámetros o los datos del libro
  useEffect(() => {
    if (!interlinearData) return;

    // Filtrar solo los versículos del capítulo actual
    const chapterVerses = interlinearData.filter(v => v.chapter === parseInt(params.chapter));
    setChapterData(chapterVerses);

    // Encontrar el versículo específico
    const verse = chapterVerses.find(v => v.verse === parseInt(params.verse));
    if (verse) {
      setVerseData(verse);
    } else if (chapterVerses.length > 0) {
      setVerseData(chapterVerses[0]);
      setParams(prev => ({ ...prev, verse: String(chapterVerses[0].verse) }));
    } else {
      setVerseData(null);
    }
  }, [interlinearData, params.chapter, params.verse]);

  const handleBookChange = (code: string) => {
    setParams(prev => ({ ...prev, book: code, chapter: "1", verse: "1" }));
    setIsBookOpen(false);
  };

  const handleChapterChange = (chapter: string) => {
    setParams(prev => ({ ...prev, chapter, verse: "1" }));
    setIsChapterOpen(false);
  };

  const handleVerseChange = (verse: string) => {
    setParams(prev => ({ ...prev, verse }));
    setIsVerseOpen(false);
  };

  const navigateVerse = (direction: number) => {
    const currentVerse = parseInt(params.verse);
    const newVerse = currentVerse + direction;

    // Verificar si el nuevo versículo existe en el capítulo actual
    const exists = chapterData.some(v => v.verse === newVerse);

    if (exists) {
      setParams(prev => ({ ...prev, verse: String(newVerse) }));
    } else if (direction > 0) {
      // Ir al siguiente capítulo si es posible
      const nextChapter = parseInt(params.chapter) + 1;
      if (currentBook && nextChapter <= currentBook.chapters) {
        setParams(prev => ({ ...prev, chapter: String(nextChapter), verse: "1" }));
      }
    } else if (direction < 0) {
      // Ir al capítulo anterior si es posible
      const prevChapter = parseInt(params.chapter) - 1;
      if (prevChapter > 0) {
        setParams(prev => ({ ...prev, chapter: String(prevChapter), verse: "1" }));
      }
    }
  };

  const hasPrevVerse = useMemo(() => {
    return !(params.book === 'gen' && params.chapter === '1' && params.verse === '1');
  }, [params]);

  const hasNextVerse = useMemo(() => {
    if (!currentBook) return false;
    const isLastBook = params.book === 'rev';
    const isLastChapter = params.chapter === String(currentBook.chapters);
    const isLastVerse = chapterData.length > 0 && params.verse === String(chapterData[chapterData.length - 1].verse);
    return !(isLastBook && isLastChapter && isLastVerse);
  }, [params, currentBook, chapterData]);

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
      <div className="flex flex-wrap items-center justify-center gap-3 p-2 rounded-2xl bg-theme-text/5 border border-theme-text/10 max-w-fit mx-auto relative z-50 shadow-sm transition-colors duration-300 ui-protect">
        {/* Book Selector */}
        <div className="relative" ref={bookRef}>
          <button
            onClick={() => { setIsBookOpen(!isBookOpen); setIsChapterOpen(false); setIsVerseOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border text-sm ui-protect ${isBookOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-theme-text/5 text-[var(--color-text)] border-theme-text/10 shadow-sm'}`}
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
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ui-protect ${b.code === params.book ? 'bg-[var(--color-link)]/10 text-[var(--color-link)] font-bold' : 'hover:bg-theme-text/5 text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border text-sm ui-protect ${isChapterOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-theme-text/5 text-[var(--color-text)] border-theme-text/10 shadow-sm'}`}
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
                    className={`flex items-center justify-center aspect-square rounded-lg text-xs transition-colors ui-protect ${num === params.chapter ? 'bg-[var(--color-link)] text-white font-bold' : 'hover:bg-theme-text/5 text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
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
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)'
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
                      className="text-[11px] opacity-20 hover:opacity-100 hover:text-[var(--color-link)] transition-all absolute -top-5 font-bold tracking-tighter ui-protect"
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
            {spanishVerse && (
              <div className="mt-auto mb-8 p-6 sm:p-8 rounded-3xl bg-theme-text/5 border border-theme-text/10 flex gap-5 items-start animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
                        ? formatRedLetters(spanishVerse, params.book, parseInt(params.chapter), parseInt(params.verse))
                        : spanishVerse
                    }}
                  />
                </div>
              </div>
            )}
            {!spanishVerse && !loading && (
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
                <span>Biblia Hebraica</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
