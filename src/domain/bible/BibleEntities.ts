// src/domain/bible/BibleEntities.ts

/**
 * Entidades de Dominio (Domain Layer)
 * Definen los objetos de negocio y sus reglas fundamentales.
 * No dependen de frameworks ni detalles de implementación.
 */

export interface BibleVerse {
    text: string;
    notes?: string[];
}

export interface BibleChapter {
    number: number;
    verses: Record<string, BibleVerse>;
}

export interface BibleBook {
    code: string;       // Identificador único (e.g., 'gen', 'mat')
    name: string;       // Nombre legible (e.g., 'Génesis')
    chapters: number;   // Total de capítulos
    section: 'at' | 'nt'; // Sección del testamento
    content?: Record<string, BibleChapter>; // Contenido opcional (lazy loading)
}

export interface BiblePassage {
    book: string;
    chapter: number;
    verses?: number[];
}

// Value Object para parámetros de navegación
export interface ReaderParams {
    book: string;
    chapter: string;
    verses: string;
    search: string;
}
