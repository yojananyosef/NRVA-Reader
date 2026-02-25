import { describe, it, expect } from 'vitest';
import { getNextChapter, getPrevChapter, getNextVerse, getPrevVerse } from './navigation';

// mock books-index.json for tests if necessary, or just rely on the actual data
describe('Navigation Utils', () => {
    describe('getNextChapter', () => {
        it('should go to next chapter in same book', () => {
            const next = getNextChapter('gen', 1);
            expect(next).toEqual({ book: 'gen', chapter: 2 });
        });

        it('should go to next book if at last chapter', () => {
            // Genesis has 50 chapters
            const next = getNextChapter('gen', 50);
            expect(next).toEqual({ book: 'exo', chapter: 1 });
        });

        it('should return null if at end of bible', () => {
            // Rev has 22 chapters
            const next = getNextChapter('rev', 22);
            expect(next).toBeNull();
        });
    });

    describe('getPrevChapter', () => {
        it('should go to previous chapter in same book', () => {
            const prev = getPrevChapter('gen', 2);
            expect(prev).toEqual({ book: 'gen', chapter: 1 });
        });

        it('should go to previous book last chapter if at first chapter', () => {
            // Exodus 1 -> Gen 50
            const prev = getPrevChapter('exo', 1);
            expect(prev).toEqual({ book: 'gen', chapter: 50 });
        });

        it('should return null if at beginning of bible', () => {
            const prev = getPrevChapter('gen', 1);
            expect(prev).toBeNull();
        });
    });

    describe('getNextVerse / getPrevVerse in interlinear', () => {
        it('should go to next verse in same chapter', () => {
            const next = getNextVerse('gen', 1, 1, 50, 31);
            expect(next).toEqual({ book: 'gen', chapter: 1, verse: 2 });
        });

        it('should go to next chapterverse 1 if at end of chapter', () => {
            const next = getNextVerse('gen', 1, 31, 50, 31);
            expect(next).toEqual({ book: 'gen', chapter: 2, verse: 1 });
        });

        it('should go to prev verse in same chapter', () => {
            const prev = getPrevVerse('gen', 1, 2);
            expect(prev).toEqual({ book: 'gen', chapter: 1, verse: 1 });
        });
    });
});
