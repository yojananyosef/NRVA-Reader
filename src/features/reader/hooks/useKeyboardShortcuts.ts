import { useEffect } from 'preact/hooks';
import { preferences } from '../../../stores/preferences';

interface ShortcutOptions {
    onNextChapter?: () => void;
    onPrevChapter?: () => void;
    onToggleTTS?: () => void;
    onToggleRuler?: () => void;
    onFocusSearch?: () => void;
    onCloseModal?: () => void;
    enabled?: boolean;
}

export function useKeyboardShortcuts({
    onNextChapter,
    onPrevChapter,
    onToggleTTS,
    onToggleRuler,
    onFocusSearch,
    onCloseModal,
    enabled = true
}: ShortcutOptions) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore keypresses inside input fields or textareas
            const target = e.target as HTMLElement;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            ) {
                if (e.key === 'Escape' && onCloseModal) {
                    onCloseModal();
                }
                return;
            }

            // Check if keyboard shortcuts are enabled in user preferences
            const currentPrefs = preferences.get();
            if (!currentPrefs.keyboardShortcutsEnabled) return;

            switch (e.key) {
                case 'ArrowRight':
                case 'j':
                case 'J':
                    if (onNextChapter && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onNextChapter();
                    }
                    break;

                case 'ArrowLeft':
                case 'k':
                case 'K':
                    if (onPrevChapter && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onPrevChapter();
                    }
                    break;

                case ' ':
                    if (onToggleTTS && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onToggleTTS();
                    }
                    break;

                case 'r':
                case 'R':
                    if (onToggleRuler && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onToggleRuler();
                    }
                    break;

                case '/':
                    if (onFocusSearch && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onFocusSearch();
                    }
                    break;

                case 'Escape':
                    if (onCloseModal) {
                        onCloseModal();
                    }
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        enabled,
        onNextChapter,
        onPrevChapter,
        onToggleTTS,
        onToggleRuler,
        onFocusSearch,
        onCloseModal
    ]);
}
