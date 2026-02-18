import { useEffect, useRef } from 'preact/hooks';
import { Copy, Check, Trash2 } from 'lucide-preact';

interface VerseMenuProps {
    isOpen: boolean;
    position: { top: number; left: number };
    onClose: () => void;
    onHighlight: (color: string) => void;
    onCopy: () => void;
    onRemoveHighlight: () => void;
    currentHighlight?: string | boolean;
}

const COLORS = [
    { name: 'yellow', value: 'var(--highlight-yellow)' },
    { name: 'green', value: 'var(--highlight-green)' },
    { name: 'blue', value: 'var(--highlight-blue)' },
    { name: 'pink', value: 'var(--highlight-pink)' },
    { name: 'purple', value: 'var(--highlight-purple)' },
];

export default function VerseMenu({
    isOpen,
    position,
    onClose,
    onHighlight,
    onCopy,
    onRemoveHighlight,
    currentHighlight
}: VerseMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            // Use setTimeout to avoid closing immediately if the click that opened it bubbles up
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-lg shadow-xl p-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, -100%) translateY(-10px)',
            }}
            role="dialog"
            aria-label="Opciones de versículo"
        >
            <div className="flex items-center gap-1 border-r border-[var(--surface-muted-border)] pr-2 mr-2">
                {COLORS.map((color) => {
                    const isSelected = currentHighlight === color.name || (currentHighlight === true && color.name === 'yellow');
                    return (
                        <button
                            key={color.name}
                            onClick={(e) => {
                                e.stopPropagation();
                                onHighlight(color.name);
                            }}
                            className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-link)] ${isSelected ? 'ring-2 ring-offset-1 ring-[var(--color-link)]' : ''}`}
                            style={{ backgroundColor: color.value }}
                            title={`Resaltar ${color.name}`}
                            aria-label={`Resaltar color ${color.name}`}
                        >
                            {isSelected && <Check size={14} className="mx-auto text-black/50" />}
                        </button>
                    );
                })}
                {(currentHighlight !== undefined && currentHighlight !== false) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveHighlight();
                        }}
                        className="p-1.5 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] transition-colors ml-1"
                        title="Quitar resaltado"
                        aria-label="Quitar resaltado"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] text-sm font-medium transition-colors"
            >
                <Copy size={16} />
                Copiar
            </button>
        </div>
    );
}
