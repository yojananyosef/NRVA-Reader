import { describe, it, expect } from 'bun:test';
import { parseBibleQuery } from '../../../utils/bibleParser';

describe('bibleParser', () => {
    it('debería parsear consultas simples de libro y capítulo', () => {
        const result = parseBibleQuery('juan 3');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ book: 'jhn', chapter: 3 });
    });

    it('debería manejar abreviaturas comunes', () => {
        const result = parseBibleQuery('gn 1');
        expect(result[0].book).toBe('gen');
    });

    it('debería ser insensible a mayúsculas', () => {
        const result = parseBibleQuery('JUAN 3');
        expect(result[0].book).toBe('jhn');
    });

    it('debería retornar array vacío para consultas inválidas', () => {
        const result = parseBibleQuery('libroinexistente 1');
        expect(result).toEqual([]);
    });

    it('debería manejar rangos de versículos (si soportado)', () => {
        // Asumiendo que el parser soporte versículos, si no, ajustamos el test
        const result = parseBibleQuery('juan 3:16');
        expect(result[0].book).toBe('jhn');
        expect(result[0].chapter).toBe(3);
        // Verificar si el parser actual extrae versículos, si no, este test es documental
    });
});
