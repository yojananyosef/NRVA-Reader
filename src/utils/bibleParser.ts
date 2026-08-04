import booksIndex from "../data/books-index.json";
import type { BiblePassage } from "../domain/search/SearchEntities";

export type { BiblePassage };



/**
 * Parser para consultas de búsqueda bíblica.
 * Ejemplos: 
 * - "Mateo 3" -> [{ book: "mat", chapter: 3 }]
 * - "mat 4:1" -> [{ book: "mat", chapter: 4, verses: [1] }]
 * - "juan 4:1-11" -> [{ book: "jhn", chapter: 4, verses: [1,2,3,4,5,6,7,8,9,10,11] }]
 * - "Mateo 3; mat 4:1, juan 4:1-11" -> Múltiples pasajes
 */
export function parseBibleQuery(query: string): BiblePassage[] {
    if (!query) return [];

    const passages = query.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    const results: BiblePassage[] = [];
    let lastBookCode: string | null = null;

    for (const p of passages) {
        // Regex 1: [Libro] [Capítulo](:[Versículos])?
        // Priorizamos la búsqueda de versículos (con ":")
        const verseMatch = p.match(/^(.+?)\s+(\d+):([\d\-,]+)$/);

        // Regex 2: [Libro] [CapítuloStart](-[CapítuloEnd])?
        // Rango de capítulos (sin ":")
        const chapterRangeMatch = p.match(/^(.+?)\s+(\d+)(?:\s*-\s*(\d+))?$/);

        // Regex 3: [Capítulo](:[Versículos])? (Solo si heredamos libro)
        const partialVerseMatch = p.match(/^(\d+):([\d\-,]+)$/);
        const partialChapterMatch = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

        if (verseMatch) {
            const bookName = verseMatch[1].toLowerCase().trim();
            const chapter = parseInt(verseMatch[2], 10);
            const versesStr = verseMatch[3];
            const bookEntry = findBookByAnyName(bookName);
            if (bookEntry) {
                lastBookCode = bookEntry.code;
                results.push({ book: bookEntry.code, chapter, verses: parseVerseRange(versesStr) });
            }
        } else if (chapterRangeMatch) {
            const bookName = chapterRangeMatch[1].toLowerCase().trim();
            const chapterStart = parseInt(chapterRangeMatch[2], 10);
            const chapterEnd = chapterRangeMatch[3] ? parseInt(chapterRangeMatch[3], 10) : chapterStart;
            const bookEntry = findBookByAnyName(bookName);
            if (bookEntry) {
                lastBookCode = bookEntry.code;
                for (let c = chapterStart; c <= chapterEnd; c++) {
                    results.push({ book: bookEntry.code, chapter: c });
                }
            }
        } else if (partialVerseMatch && lastBookCode) {
            const chapter = parseInt(partialVerseMatch[1], 10);
            const versesStr = partialVerseMatch[2];
            results.push({ book: lastBookCode, chapter, verses: parseVerseRange(versesStr) });
        } else if (partialChapterMatch && lastBookCode) {
            const chapterStart = parseInt(partialChapterMatch[1], 10);
            const chapterEnd = partialChapterMatch[2] ? parseInt(partialChapterMatch[2], 10) : chapterStart;
            for (let c = chapterStart; c <= chapterEnd; c++) {
                results.push({ book: lastBookCode, chapter: c });
            }
        }
    }

    return results;
}

export function normalizeText(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/(1ra|1ª|1er|1ro|1º)/g, "1")
        .replace(/(2da|2ª|2do|2º)/g, "2")
        .replace(/(3ra|3ª|3ro|3º)/g, "3")
        .trim();
}

/**
 * Busca coincidencias de libros para sugerencias en tiempo real.
 */
export function getBookSuggestions(partial: string) {
    if (!partial || partial.length < 1) return [];

    const search = normalizeText(partial);

    const suggestions = booksIndex.filter(book => {
        const name = normalizeText(book.name);
        const code = normalizeText(book.code);

        return name.includes(search) || code.includes(search);
    });

    return suggestions.slice(0, 5);
}

function findBookByAnyName(name: string) {
    const cleanName = normalizeText(name);

    // Primero búsqueda exacta por nombre normalizado
    let book = booksIndex.find(b => normalizeText(b.name) === cleanName);
    if (book) return book;

    // Búsqueda por código o prefijo
    book = booksIndex.find(b =>
        normalizeText(b.code) === cleanName ||
        normalizeText(b.name).startsWith(cleanName)
    );

    // Casos especiales y abreviaturas comunes
    if (!book) {
        const specialNames: Record<string, string> = {
            // Pentateuco
            'genesis': 'gen', 'gn': 'gen',
            'exodo': 'exo', 'ex': 'exo',
            'levitico': 'lev', 'lv': 'lev',
            'numeros': 'num', 'nm': 'num',
            'deuteronomio': 'deu', 'dt': 'deu',
            // Históricos
            'josue': 'jos',
            'jueces': 'jdg', 'jue': 'jdg',
            'rut': 'rut', 'rt': 'rut',
            '1 samuel': '1sa', '1sa': '1sa', '1 sam': '1sa',
            '2 samuel': '2sa', '2sa': '2sa', '2 sam': '2sa',
            '1 reyes': '1ki', '1re': '1ki', '1 rey': '1ki',
            '2 reyes': '2ki', '2re': '2ki', '2 rey': '2ki',
            '1 cronicas': '1ch', '1cr': '1ch',
            '2 cronicas': '2ch', '2cr': '2ch',
            'esdras': 'ezr', 'esd': 'ezr',
            'nehemias': 'neh',
            'ester': 'est',
            // Poéticos
            'job': 'job',
            'salmos': 'psa', 'sal': 'psa', 'ps': 'psa', 'salmo': 'psa',
            'proverbios': 'pro', 'pr': 'pro', 'prov': 'pro',
            'eclesiastes': 'ecc', 'ec': 'ecc',
            'cantares': 'sol', 'cant': 'sol',
            // Profetas Mayores
            'isaias': 'isa', 'is': 'isa',
            'jeremias': 'jer', 'jr': 'jer',
            'lamentaciones': 'lam',
            'ezequiel': 'eze', 'ez': 'eze',
            'daniel': 'dan', 'dn': 'dan',
            // Profetas Menores
            'oseas': 'hos', 'os': 'hos',
            'joel': 'joe', 'jl': 'joe',
            'amos': 'amo', 'am': 'amo',
            'abdias': 'oba', 'ab': 'oba',
            'jonas': 'jon',
            'miqueas': 'mic', 'mi': 'mic',
            'nahum': 'nah',
            'habacuc': 'hab',
            'sofonias': 'zep',
            'hageo': 'hag',
            'zacarias': 'zec',
            'malaquias': 'mal',
            // Nuevo Testamento - Evangelios y Hechos
            'mateo': 'mat', 'mt': 'mat',
            'marcos': 'mrk', 'mc': 'mrk',
            'lucas': 'luk', 'lc': 'luk',
            'juan': 'jhn', 'jn': 'jhn',
            'hechos': 'act', 'hch': 'act',
            // Epístolas Paulinas
            'romanos': 'rom', 'ro': 'rom',
            '1 corintios': '1co', '1cor': '1co',
            '2 corintios': '2co', '2cor': '2co',
            'galatas': 'gal', 'gl': 'gal',
            'efesios': 'eph', 'ef': 'eph',
            'filipenses': 'phi', 'fil': 'phi',
            'colosenses': 'col',
            '1 tesalonicenses': '1th', '1ts': '1th',
            '2 tesalonicenses': '2th', '2ts': '2th',
            '1 timoteo': '1ti', '1tm': '1ti',
            '2 timoteo': '2ti', '2tm': '2ti',
            'tito': 'tit', 'tt': 'tit',
            'filemon': 'phm',
            // Otras Epístolas y Apocalipsis
            'hebreos': 'heb',
            'santiago': 'jam', 'stgo': 'jam', 'sant': 'jam',
            '1 pedro': '1pe', '1p': '1pe',
            '2 pedro': '2pe', '2p': '2pe',
            '1 juan': '1jo', '1j': '1jo', '1jn': '1jo',
            '2 juan': '2jo', '2j': '2jo', '2jn': '2jo',
            '3 juan': '3jo', '3j': '3jo', '3jn': '3jo',
            'judas': 'jud',
            'apocalipsis': 'rev', 'ap': 'rev', 'revelaciones': 'rev'
        };
        const code = specialNames[cleanName];
        if (code) return booksIndex.find(b => b.code === code);
    }

    return book;
}

function parseVerseRange(range: string): number[] {
    const result: number[] = [];
    const parts = range.split(",");
    parts.forEach((part) => {
        if (part.includes("-")) {
            const [start, end] = part.split("-").map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) result.push(i);
            }
        } else {
            const n = Number(part);
            if (!isNaN(n)) result.push(n);
        }
    });
    return result.sort((a, b) => a - b);
}

export function stringifyPassage(passage: BiblePassage): string {
    const book = booksIndex.find(b => b.code === passage.book);
    const name = book ? book.name : passage.book;
    let verses = "";
    if (passage.verses && passage.verses.length > 0) {
        // Intentar compactar rangos, ej [1,2,3,5] -> "1-3, 5"
        const sorted = [...passage.verses].sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sorted[0];
        let end = sorted[0];

        for (let i = 1; i <= sorted.length; i++) {
            if (i < sorted.length && sorted[i] === end + 1) {
                end = sorted[i];
            } else {
                if (start === end) {
                    ranges.push(start.toString());
                } else {
                    ranges.push(`${start}-${end}`);
                }
                if (i < sorted.length) {
                    start = sorted[i];
                    end = sorted[i];
                }
            }
        }
        verses = ":" + ranges.join(",");
    }
    return `${name} ${passage.chapter}${verses}`;
}
