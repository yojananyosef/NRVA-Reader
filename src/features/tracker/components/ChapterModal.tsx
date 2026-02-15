import { X, Check } from "lucide-preact";
import type { Book } from "../../../application/tracker/hooks/useTracker";
import { createPortal } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

type Props = {
  book: Book;
  completedChapters: number[];
  onToggleChapter: (chapter: number) => void;
  onClose: () => void;
  isOpen: boolean;
};

export default function ChapterModal({ book, completedChapters, onToggleChapter, onClose, isOpen }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Bloquear scroll del body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const progress = Number(((completedChapters.length / book.chapters) * 100).toFixed(1));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-base leading-normal tracking-normal"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{book.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: 'var(--color-link)' }} />
              </div>
              <p className="text-xs font-medium opacity-70">{progress}% Completado</p>
            </div>
          </div>
          <div
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClose();
              }
            }}
            className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-5 gap-3">
            {chapters.map((chapter) => {
              const isCompleted = completedChapters.includes(chapter);
              return (
                <div
                  key={chapter}
                  onClick={() => onToggleChapter(chapter)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onToggleChapter(chapter);
                    }
                  }}
                  className={`
                    relative aspect-square flex items-center justify-center rounded-xl text-lg font-bold transition-all duration-300 ease-out
                    border-2 cursor-pointer
                    ${isCompleted
                      ? 'text-white scale-105 z-10'
                      : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                    }
                  `}
                  style={isCompleted ? {
                    backgroundColor: 'var(--color-link)',
                    borderColor: 'var(--color-link)',
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--color-link), transparent 70%)'
                  } : {
                    backgroundColor: 'var(--surface-muted-bg)',
                    borderColor: 'transparent',
                    color: 'var(--color-text)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCompleted) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-hover-bg)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--color-text), transparent 80%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCompleted) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-muted-bg)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }
                  }}
                  aria-pressed={isCompleted}
                  aria-label={`Capítulo ${chapter}, ${isCompleted ? 'leído' : 'no leído'}`}
                >
                  {/* Check Icon Overlay */}
                  <div className={`
                    absolute top-1 right-1 transition-all duration-300
                    ${isCompleted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'}
                  `}>
                    <Check className="w-3.5 h-3.5" strokeWidth={4} />
                  </div>

                  {/* Chapter Number */}
                  <span className={`transition-all duration-300 ${isCompleted ? 'scale-110' : 'scale-100'}`}>
                    {chapter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
