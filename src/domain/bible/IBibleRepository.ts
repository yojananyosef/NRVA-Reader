import type { BibleBook } from './BibleEntities';

export interface CommentaryVerse {
    verse: number;
    text: string;
    notes?: string[];
}

export interface CommentaryData {
    book: string;
    chapter: number;
    verses: CommentaryVerse[];
}

export interface IBibleRepository {
    getChapterData(bookCode: string): Promise<any>;
    getCommentaryData(bookCode: string): Promise<any>;
}
