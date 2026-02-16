import { useState } from "preact/hooks";
import { useTracker, type Book } from "../../../application/tracker/hooks/useTracker";
import ChapterModal from "./ChapterModal";
import { RotateCcw, Check } from "lucide-preact";

export default function Tracker() {
  const {
    books,
    completedChapters,
    toggleChapter,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    isLoading
  } = useTracker();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center">Cargando progreso...</div>;
  }

  const totalProgress = getTotalProgress();
  const otBooks = books.filter(b => b.section === "at");
  const ntBooks = books.filter(b => b.section === "nt");

  const otProgress = Number((
    otBooks.reduce((acc, book) => acc + (completedChapters[book.code]?.length || 0), 0) /
    otBooks.reduce((acc, book) => acc + book.chapters, 0) * 100
  ).toFixed(1));

  const ntProgress = Number((
    ntBooks.reduce((acc, book) => acc + (completedChapters[book.code]?.length || 0), 0) /
    ntBooks.reduce((acc, book) => acc + book.chapters, 0) * 100
  ).toFixed(1));

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-10 px-4 md:px-8">

      {/* Header & Main Progress */}
      <div className="flex flex-col items-center justify-center py-8 relative">
        <h1 className="text-3xl font-bold mb-8">Año bíblico</h1>

        <div
          onClick={resetProgress}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              resetProgress();
            }
          }}
          className="absolute top-8 right-0 md:right-8 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          title="Reiniciar todo el progreso"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="hidden md:inline text-sm">Reiniciar</span>
        </div>

        <div className="rounded-3xl p-8 shadow-sm border w-full max-w-2xl flex flex-col md:flex-row items-center justify-around gap-8"
          style={{ backgroundColor: "var(--surface-muted-bg)", borderColor: "var(--surface-muted-border)" }}>

          {/* Circular Progress */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-current"
                style={{ color: "color-mix(in srgb, var(--color-text), transparent 90%)" }}
                stroke-width="10"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              <circle
                className="text-[var(--color-link)] progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                stroke-width="10"
                stroke-linecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke-dasharray={`${2 * Math.PI * 40}`}
                stroke-dashoffset={`${2 * Math.PI * 40 * (1 - totalProgress / 100)}`}
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-medium text-gray-500">La Biblia entera</span>
              <span className="text-4xl font-bold">{totalProgress}%</span>
            </div>
          </div>

          {/* Sub Progress Stats */}
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="stroke-current" style={{ color: "color-mix(in srgb, var(--color-text), transparent 90%)" }} stroke-width="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-[var(--color-link)] stroke-current transition-all duration-1000 ease-out" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent"
                    stroke-dasharray={`${2 * Math.PI * 40}`}
                    stroke-dashoffset={`${2 * Math.PI * 40 * (1 - otProgress / 100)}`}
                  ></circle>
                </svg>
                <span className="absolute text-lg font-bold">{otProgress}%</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Antiguo Testamento</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="stroke-current" style={{ color: "color-mix(in srgb, var(--color-text), transparent 90%)" }} stroke-width="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-[var(--color-link)] stroke-current transition-all duration-1000 ease-out" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent"
                    stroke-dasharray={`${2 * Math.PI * 40}`}
                    stroke-dashoffset={`${2 * Math.PI * 40 * (1 - ntProgress / 100)}`}
                  ></circle>
                </svg>
                <span className="absolute text-lg font-bold">{ntProgress}%</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Nuevo Testamento</span>
            </div>
          </div>

        </div>
      </div>

      {/* Book Lists */}
      <div className="space-y-12">
        <Section title="Antiguo Testamento" books={otBooks} onSelect={setSelectedBook} getProgress={getBookProgress} />
        <Section title="Nuevo Testamento" books={ntBooks} onSelect={setSelectedBook} getProgress={getBookProgress} />
      </div>

      {/* Modal */}
      {selectedBook && (
        <ChapterModal
          book={selectedBook}
          completedChapters={completedChapters[selectedBook.code] || []}
          onToggleChapter={(chapter) => toggleChapter(selectedBook.code, chapter)}
          onClose={() => setSelectedBook(null)}
          isOpen={!!selectedBook}
        />
      )}
    </div>
  );
}

function Section({ title, books, onSelect, getProgress }: { title: string, books: Book[], onSelect: (b: Book) => void, getProgress: (c: string) => number }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map(book => {
          const progress = getProgress(book.code);
          return (
            <div
              key={book.code}
              onClick={() => onSelect(book)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(book);
                }
              }}
              className="group relative p-4 rounded-xl border transition-all duration-200 text-left hover:shadow-md cursor-pointer flex flex-col justify-between h-32"
              style={{
                backgroundColor: "var(--surface-muted-bg)",
                borderColor: "var(--surface-muted-border)"
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-link)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--surface-muted-border)')}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg leading-tight">{book.name}</span>
                {progress === 100 && (
                  <span className="text-[var(--color-link)] shrink-0">
                    <Check className="h-5 w-5" />
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end text-[10px] font-bold opacity-60 uppercase tracking-wider">
                  <span>Progreso</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%`, backgroundColor: 'var(--color-link)' }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
