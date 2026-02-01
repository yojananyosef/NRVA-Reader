import { map } from 'nanostores';

export type Theme = 'light' | 'dark' | 'sepia';
export type FontFamily = 'sans' | 'dyslexic';
export const PREFS_STORAGE_KEY = 'bible-reader-prefs';

export interface Preferences {
    theme: Theme;
    fontSize: number; // in px
    lineHeight: number;
    letterSpacing: number; // in em
    wordSpacing: number; // in em
    fontFamily: FontFamily;
    rulerEnabled: boolean;
    speechRate: number;
    skipVerses: boolean;
    skipFootnotes: boolean;
    showRedLetters: boolean;
}

export const defaultPreferences: Preferences = {
    theme: 'light',
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0.02,
    wordSpacing: 0.16,
    fontFamily: 'sans',
    rulerEnabled: false,
    speechRate: 1.0,
    skipVerses: true,
    skipFootnotes: true,
    showRedLetters: true
};

let initialPrefs = defaultPreferences;

if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(PREFS_STORAGE_KEY);
    if (stored) {
        try {
            initialPrefs = { ...defaultPreferences, ...JSON.parse(stored) };
        } catch (e) {
            console.error('Failed to parse preferences', e);
        }
    }
}

export const preferences = map<Preferences>(initialPrefs);

// Sync with localStorage whenever preferences change
if (typeof localStorage !== 'undefined') {
    preferences.subscribe((value) => {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(value));
    });

    // Sync from localStorage when changed in another tab
    window.addEventListener('storage', (e) => {
        if (e.key === PREFS_STORAGE_KEY && e.newValue) {
            try {
                const newPrefs = JSON.parse(e.newValue);
                preferences.set({ ...defaultPreferences, ...newPrefs });
            } catch (err) {
                console.error('Failed to sync preferences from storage event', err);
            }
        }
    });
}

// Helper to reset to defaults
export const resetPreferences = () => {
    preferences.set(defaultPreferences);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(defaultPreferences));
    }
};
