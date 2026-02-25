import { X, Library, ChevronRight } from "lucide-preact";
import { createPortal } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    commentary: any;
    loading: boolean;
    dailyVerse: any;
};

export default function CommentaryModal({ isOpen, onClose, commentary, loading, dailyVerse }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop con el color de fondo del tema */}
            <div
                className="absolute inset-0 bg-[var(--color-bg)] opacity-80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-base leading-normal tracking-normal flex flex-col max-h-[90vh] border surface-card"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                    <div className="flex items-center gap-3">
                        <div class="bg-[var(--color-link)] text-white p-2 rounded-lg shadow-sm">
                            <Library size={20} />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--color-link)] !m-0 leading-none">Comentario Bíblico</h3>
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

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-link)]"></div>
                        </div>
                    ) : commentary ? (
                        <div class="prose prose-lg max-w-none text-[var(--color-text)] reader-text">
                            {commentary.phrase && (
                                <div class="font-bold mb-4 italic opacity-80 border-b border-theme-text/10 pb-2 text-xl">
                                    {commentary.phrase}
                                </div>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: commentary.content }} />

                            <div class="mt-8 pt-4 border-t border-[var(--surface-muted-border)] flex justify-end">
                                <a
                                    href={`/commentary?book=${dailyVerse.bookCode}&chapter=${dailyVerse.chapter}#com-${dailyVerse.verse}`}
                                    class="text-sm font-bold text-[var(--color-link)] flex items-center gap-1 bg-[var(--surface-muted-bg)] px-4 py-2 rounded-lg transition-colors hover:bg-[var(--surface-hover-bg)] !no-underline"
                                >
                                    Leer completo
                                    <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div class="text-center py-12 opacity-60 italic flex flex-col items-center gap-4">
                            <Library size={48} className="opacity-20" />
                            <p>No hay comentario disponible para este versículo específico.</p>
                            <a
                                href={`/commentary?book=${dailyVerse.bookCode}&chapter=${dailyVerse.chapter}`}
                                class="text-[var(--color-link)] hover:underline font-bold mt-2"
                            >
                                Ver comentario del capítulo
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
