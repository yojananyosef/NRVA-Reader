import { map } from 'nanostores';

interface HighlightState {
    [key: string]: string | boolean;
}

export const highlights = map<HighlightState>({});

const HIGHLIGHTS_STORAGE_KEY = 'bible-reader-highlights';

if (typeof localStorage !== 'undefined') {
    try {
        const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
        if (stored) {
            highlights.set(JSON.parse(stored));
        }
    } catch (e) {
        console.error('Error loading highlights', e);
    }
}

// Sync with localStorage
highlights.subscribe((value) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(value));
    }
});

export function toggleHighlight(verseId: string, color: string = 'yellow') {
    const current = highlights.get();
    const currentValue = current[verseId];

    // Check if it's already highlighted with the same color
    // Legacy 'true' is treated as 'yellow'
    const isSameColor = currentValue === color || (currentValue === true && color === 'yellow');

    if (isSameColor) {
        const { [verseId]: _, ...rest } = current;
        highlights.set(rest);
    } else {
        highlights.setKey(verseId, color);
    }
}

export function removeHighlight(verseId: string) {
    const current = highlights.get();
    if (current[verseId]) {
        const { [verseId]: _, ...rest } = current;
        highlights.set(rest);
    }
}
