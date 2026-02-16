import { preferences } from '../../../stores/preferences';
import { applyThemeToDocument } from './theme-manager';

// This script runs on the client side to sync store changes to the DOM
// It ensures that any change to the preferences store (from UI or storage event)
// is immediately reflected in the document styles.

export function initPreferencesSync() {
    if (typeof window === 'undefined') return;

    // Subscribe to store changes and update DOM
    preferences.subscribe((prefs) => {
        applyThemeToDocument(prefs);
    });

    // Initial application is handled by inline script in Layout to prevent flash,
    // but we re-apply here to ensure state consistency with the store.
    applyThemeToDocument(preferences.get());
}

// Auto-initialize if imported
initPreferencesSync();

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            },
            (err) => {
                console.log('ServiceWorker registration failed: ', err);
            }
        );
    });
}

