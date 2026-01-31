import booksIndex from "../data/books-index.json";

export interface BiblePassage {
    book: string;
    chapter: number;
    verses?: number[];
}

/**
 * Busca coincidencias de libros para sugerencias en tiempo real.
 */
export function getBookSuggestions(partial: string) {
    if (!partial || partial.length < 1) return [];

    const search = partial.toLowerCase().trim();

    // Lista de nombres extendida para búsqueda (incluye variaciones)
    const suggestions = booksIndex.filter(book => {
        const name = book.name.toLowerCase();
        const code = book.code.toLowerCase();

        // Coincidencia por nombre, código o si empieza por...
        return name.includes(search) || code.includes(search);
    });

    return suggestions.slice(0, 5); // Limitar a 5 sugerencias
}

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
        // Regex para capturar [Libro] [Capítulo](:[Versículos])?
        // O solo [Capítulo](:[Versículos])? si heredamos el libro
        const matchWithBook = p.match(/^(.+?)\s+(\d+)(?::([\d\-,]+))?$/);
        const matchOnlyChapter = p.match(/^(\d+)(?::([\d\-,]+))?$/);

        if (matchWithBook) {
            const bookName = matchWithBook[1].toLowerCase().trim();
            const chapter = parseInt(matchWithBook[2], 10);
            const versesStr = matchWithBook[3];

            const bookEntry = findBookByAnyName(bookName);
            if (bookEntry) {
                lastBookCode = bookEntry.code;
                const passage: BiblePassage = {
                    book: bookEntry.code,
                    chapter: chapter
                };
                if (versesStr) passage.verses = parseVerseRange(versesStr);
                results.push(passage);
            }
        } else if (matchOnlyChapter && lastBookCode) {
            // Caso como "juan 4, 3" donde el 3 hereda "juan"
            const chapter = parseInt(matchOnlyChapter[1], 10);
            const versesStr = matchOnlyChapter[2];

            const passage: BiblePassage = {
                book: lastBookCode,
                chapter: chapter
            };
            if (versesStr) passage.verses = parseVerseRange(versesStr);
            results.push(passage);
        }
    }

    return results;
}

function findBookByAnyName(name: string) {
    // Primero búsqueda exacta por nombre
    let book = booksIndex.find(b => b.name.toLowerCase() === name);
    if (book) return book;

    // Búsqueda por abreviatura o prefijo
    // Por ahora usamos una lógica simple, se podría mejorar con un mapa de abreviaturas
    book = booksIndex.find(b =>
        b.code.toLowerCase() === name ||
        b.name.toLowerCase().startsWith(name)
    );

    // Casos especiales y abreviaturas comunes
    if (!book) {
        const specialNames: Record<string, string> = {
            // Pentateuco
            'genesis': 'gen', 'génesis': 'gen', 'gn': 'gen',
            'exodo': 'exo', 'éxodo': 'exo', 'ex': 'exo',
            'levitico': 'lev', 'levítico': 'lev', 'lv': 'lev',
            'numeros': 'num', 'números': 'num', 'nm': 'num',
            'deuteronomio': 'deu', 'dt': 'deu',
            // Históricos
            'josue': 'jos', 'josué': 'jos', 'jos': 'jos',
            'jueces': 'jdg', 'jue': 'jdg',
            'rut': 'rut', 'rt': 'rut',
            '1 samuel': '1sa', '1sa': '1sa', '1 sam': '1sa',
            '2 samuel': '2sa', '2sa': '2sa', '2 sam': '2sa',
            '1 reyes': '1ki', '1re': '1ki', '1 rey': '1ki',
            '2 reyes': '2ki', '2re': '2ki', '2 rey': '2ki',
            '1 cronicas': '1ch', '1cr': '1ch', '1 crónicas': '1ch',
            '2 cronicas': '2ch', '2cr': '2ch', '2 crónicas': '2ch',
            'esdras': 'ezr', 'esd': 'ezr',
            'nehemias': 'neh', 'nehemías': 'neh', 'neh': 'neh',
            'ester': 'est', 'est': 'est',
            // Poéticos
            'job': 'job',
            'salmos': 'psa', 'sal': 'psa', 'ps': 'psa',
            'proverbios': 'pro', 'pr': 'pro', 'prov': 'pro',
            'eclesiastes': 'ecc', 'eclesiastés': 'ecc', 'ec': 'ecc',
            'cantares': 'sng', 'cant': 'sng',
            // Profetas Mayores
            'isaias': 'isa', 'isaías': 'isa', 'is': 'isa',
            'jeremias': 'jer', 'jeremías': 'jer', 'jr': 'jer',
            'lamentaciones': 'lam', 'lam': 'lam',
            'ezequiel': 'ezk', 'ez': 'ezk',
            'daniel': 'dan', 'dn': 'dan',
            // Profetas Menores
            'oseas': 'hos', 'os': 'hos',
            'joel': 'jol', 'jl': 'jol',
            'amos': 'amo', 'amós': 'amo', 'am': 'amo',
            'abdias': 'oba', 'abdías': 'oba', 'ab': 'oba',
            'jonas': 'jon', 'jonás': 'jon',
            'miqueas': 'mic', 'mi': 'mic',
            'nahum': 'nam', 'nahún': 'nam',
            'habacuc': 'hab', 'hab': 'hab',
            'sofonias': 'zep', 'sofonías': 'zep',
            'hageo': 'hag', 'hag': 'hag',
            'zacarias': 'zec', 'zacarías': 'zec',
            'malaquias': 'mal', 'malaquías': 'mal',
            // Nuevo Testamento - Evangelios y Hechos
            'mateo': 'mat', 'mt': 'mat',
            'marcos': 'mrk', 'mc': 'mrk',
            'lucas': 'luk', 'lc': 'luk',
            'juan': 'jhn', 'jn': 'jhn',
            'hechos': 'act', 'hch': 'act',
            // Epístolas Paulinas
            'romanos': 'rom', 'rom': 'rom', 'ro': 'rom',
            '1 corintios': '1co', '1co': '1co',
            '2 corintios': '2co', '2co': '2co',
            'galatas': 'gal', 'gálatas': 'gal', 'gl': 'gal',
            'efesios': 'eph', 'ef': 'eph',
            'filipenses': 'php', 'fil': 'php',
            'colosenses': 'col', 'col': 'col',
            '1 tesalonicenses': '1th', '1ts': '1th',
            '2 tesalonicenses': '2th', '2ts': '2th',
            '1 timoteo': '1ti', '1tm': '1ti',
            '2 timoteo': '2ti', '2tm': '2ti',
            'tito': 'tit', 'tt': 'tit',
            'filemon': 'phm', 'filemón': 'phm',
            // Otras Epístolas y Apocalipsis
            'hebreos': 'heb', 'heb': 'heb',
            'santiago': 'jas', 'stgo': 'jas', 'sant': 'jas',
            '1 pedro': '1pe', '1p': '1pe',
            '2 pedro': '2pe', '2p': '2pe',
            '1 juan': '1jn', '1j': '1jn',
            '2 juan': '2jn', '2j': '2jn',
            '3 juan': '3jn', '3j': '3jn',
            'judas': 'jud', 'jud': 'jud',
            'apocalipsis': 'rev', 'ap': 'rev', 'revelaciones': 'rev'
        };
        const code = specialNames[name];
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
