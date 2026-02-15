import { map } from 'nanostores';

export interface TrackerState {
  [bookCode: string]: number[];
}

const STORAGE_KEY = 'bible-tracker-progress';

// Store global para el progreso de lectura
export const tracker = map<TrackerState>({});

// Cargar estado inicial
if (typeof localStorage !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      tracker.set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Error loading tracker progress:', e);
  }
}

// Sincronizar con localStorage
tracker.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
});

/**
 * Alterna el estado de completado de un capítulo
 */
export function toggleChapterCompletion(bookCode: string, chapter: number) {
  const current = tracker.get();
  const currentBookChapters = current[bookCode] || [];
  const isCompleted = currentBookChapters.includes(chapter);

  let newBookChapters;
  if (isCompleted) {
    newBookChapters = currentBookChapters.filter((c) => c !== chapter);
  } else {
    newBookChapters = [...currentBookChapters, chapter];
  }

  tracker.setKey(bookCode, newBookChapters);
}

/**
 * Reinicia todo el progreso
 */
export function resetTrackerProgress() {
  tracker.set({});
}
