import { describe, it, expect } from 'vitest';
import { shouldHaveRedLetters, formatRedLetters } from './redLetterUtils';

describe('redLetterUtils', () => {
    describe('shouldHaveRedLetters', () => {
        it('should return string array for known red letter verses in Matthew', () => {
            const mat3_15 = shouldHaveRedLetters('mat', 3, 15);
            expect(mat3_15).not.toBeNull();
            expect(Array.isArray(mat3_15)).toBe(true);
        });

        it('should return null for non-red letter verses', () => {
            expect(shouldHaveRedLetters('gen', 1, 1)).toBeNull();
        });
    });

    describe('formatRedLetters', () => {
        it('should wrap red letter verse in jesus-words span when text matches', () => {
            const text = '“Por favor, hazlo, porque es bueno que hagamos lo que Dios dice que es correcto”';
            const formatted = formatRedLetters(text, 'mat', 3, 15);
            expect(formatted).toContain('class="jesus-words');
        });

        it('should leave non-red letter verse text unchanged', () => {
            const text = 'En el principio creó Dios los cielos y la tierra.';
            const formatted = formatRedLetters(text, 'gen', 1, 1);
            expect(formatted).toBe(text);
        });
    });
});
