import { describe, it, expect } from 'vitest';
import { parseBibleQuery, getBookSuggestions, normalizeText } from './bibleParser';

describe('bibleParser Utils', () => {
    describe('normalizeText', () => {
        it('should strip diacritics and normalize accents', () => {
            expect(normalizeText('Génesis')).toBe('genesis');
            expect(normalizeText('Éxodo')).toBe('exodo');
            expect(normalizeText('Salmos')).toBe('salmos');
        });

        it('should convert ordinals (1ra, 2da, 1º) to numbers', () => {
            expect(normalizeText('1ra Juan')).toBe('1 juan');
            expect(normalizeText('2da Corintios')).toBe('2 corintios');
            expect(normalizeText('1º Pedro')).toBe('1 pedro');
        });
    });

    describe('getBookSuggestions', () => {
        it('should find book suggestions for partial input', () => {
            const suggestions = getBookSuggestions('gen');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].code).toBe('gen');
        });

        it('should handle accented partial inputs', () => {
            const suggestions = getBookSuggestions('gén');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].code).toBe('gen');
        });
    });

    describe('parseBibleQuery', () => {
        it('should parse standard book and chapter queries', () => {
            const res = parseBibleQuery('Mateo 3');
            expect(res).toEqual([{ book: 'mat', chapter: 3 }]);
        });

        it('should parse queries with verses range', () => {
            const res = parseBibleQuery('Juan 3:16-18');
            expect(res).toEqual([{ book: 'jhn', chapter: 3, verses: [16, 17, 18] }]);
        });

        it('should handle numbered books and ordinals', () => {
            const res1 = parseBibleQuery('1 Juan 2:1');
            expect(res1).toEqual([{ book: '1jo', chapter: 2, verses: [1] }]);

            const res2 = parseBibleQuery('1ra Juan 2:1');
            expect(res2).toEqual([{ book: '1jo', chapter: 2, verses: [1] }]);
        });

        it('should handle accented queries', () => {
            const res = parseBibleQuery('Éxodo 20:1-5');
            expect(res).toEqual([{ book: 'exo', chapter: 20, verses: [1, 2, 3, 4, 5] }]);
        });

        it('should return empty array for invalid input', () => {
            expect(parseBibleQuery('')).toEqual([]);
        });
    });
});
