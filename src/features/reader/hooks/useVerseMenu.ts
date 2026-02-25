import { useState, useCallback } from 'preact/hooks';
import { toggleHighlight, removeHighlight } from '../../../stores/highlights';

export interface VerseMenuState {
    isOpen: boolean;
    position: { top: number; left: number };
    verseId: string;
    verseText: string;
}

export function useVerseMenu(bookName: string) {
    const [menuState, setMenuState] = useState<VerseMenuState | null>(null);

    const handleVerseClick = useCallback((e: MouseEvent | KeyboardEvent, verseId: string, verseText: string) => {
        // If clicking the same verse, close menu (toggle)
        if (menuState?.isOpen && menuState.verseId === verseId) {
            setMenuState(null);
            return;
        }

        let position = { top: 0, left: 0 };
        if (e instanceof MouseEvent) {
            position = { top: e.clientY, left: e.clientX };
        } else {
            // Fallback for keyboard
            const target = e.target as HTMLElement;
            const rect = target.getBoundingClientRect();
            position = { top: rect.top + rect.height / 2, left: rect.left + rect.width / 2 };
        }

        setMenuState({
            isOpen: true,
            position,
            verseId,
            verseText
        });
    }, [menuState]);

    const handleHighlight = useCallback((color: string) => {
        if (menuState) {
            toggleHighlight(menuState.verseId, color);
            setMenuState(null);
        }
    }, [menuState]);

    const handleRemoveHighlight = useCallback(() => {
        if (menuState) {
            removeHighlight(menuState.verseId);
            setMenuState(null);
        }
    }, [menuState]);

    const handleCopy = useCallback(async () => {
        if (menuState) {
            try {
                const parts = menuState.verseId.split('-');
                const verseNum = parts.pop();
                const chapterNum = parts.pop();

                // Strip HTML tags
                const cleanText = menuState.verseText.replace(/<[^>]*>?/gm, '');

                const textToCopy = `${bookName} ${chapterNum}:${verseNum}\n${cleanText}`;

                await navigator.clipboard.writeText(textToCopy);
            } catch (err) {
                console.error('Failed to copy', err);
            }
            setMenuState(null);
        }
    }, [menuState, bookName]);

    return {
        menuState,
        setMenuState,
        handleVerseClick,
        handleHighlight,
        handleRemoveHighlight,
        handleCopy
    };
}
