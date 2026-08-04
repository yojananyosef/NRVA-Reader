import { describe, it, expect, beforeEach } from 'vitest';
import { preferences, defaultPreferences, resetPreferences } from './preferences';

describe('preferences store', () => {
    beforeEach(() => {
        resetPreferences();
    });

    it('should initialize with default preferences', () => {
        const current = preferences.get();
        expect(current.theme).toBe('light');
        expect(current.fontSize).toBe(18);
        expect(current.lineHeight).toBe(1.6);
        expect(current.bionicReading).toBe(false);
        expect(current.phoneticDots).toBe(false);
        expect(current.keyboardShortcutsEnabled).toBe(true);
    });

    it('should update preferences when set', () => {
        preferences.set({ ...defaultPreferences, theme: 'sepia', bionicReading: true });
        const updated = preferences.get();
        expect(updated.theme).toBe('sepia');
        expect(updated.bionicReading).toBe(true);
    });

    it('should reset preferences to default when resetPreferences is called', () => {
        preferences.set({ ...defaultPreferences, theme: 'dark', fontSize: 24 });
        resetPreferences();
        const reset = preferences.get();
        expect(reset.theme).toBe('light');
        expect(reset.fontSize).toBe(18);
    });
});
