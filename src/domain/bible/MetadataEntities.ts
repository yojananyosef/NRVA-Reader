// src/domain/bible/MetadataEntities.ts

export interface ChapterTitleContent {
    verse: number;
    text: string;
}

export interface ChapterTitle {
    chapter: number;
    content: ChapterTitleContent[];
}

export interface BookTitle {
    display: string; // Nombre del libro en el JSON de títulos
    chapters: ChapterTitle[];
}

export interface BibleTitlesData {
    data: BookTitle[];
}
