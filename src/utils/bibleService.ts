
import { fetchWithCache } from './fetchWithCache';
import type { BibleVerse } from '../domain/bible/BibleEntities';

interface NrvaVerse {
    verse: number;
    text: string;
}

interface NrvaChapter {
    chapter: number;
    verses: NrvaVerse[];
}

interface NrvaBook {
    id: string;
    name: string;
    chapters: NrvaChapter[];
}

// Tipos para la estructura local (usada por la app)
export interface LocalVerse extends BibleVerse {
    texto: string; // Alias para text
    notas?: string[]; // Alias para notes
}

export interface LocalChapter {
    [verse: string]: LocalVerse;
}

export interface LocalBook {
    nombre: string;
    categoria: string;
    capitulo: {
        [chapter: string]: LocalChapter;
    };
    [key: string]: any;
}

const NRVA_RAW_BASE_URL = 'https://raw.githubusercontent.com/yojananyosef/NRVA/main/books';

const BOOK_MAPPING: Record<string, string> = {
    'sol': 'SNG',
    'eze': 'EZK',
    'joe': 'JOL',
    'nah': 'NAM',
    'phi': 'PHP',
    'jam': 'JAS',
    '1jo': '1JN',
    '2jo': '2JN',
    '3jo': '3JN',
    'jud': 'JUD'
};

const OSIS_MAPPING: Record<string, string> = {
    'gen': 'Gen',
    'exo': 'Exod',
    'lev': 'Lev',
    'num': 'Num',
    'deu': 'Deut',
    'jos': 'Josh',
    'jdg': 'Judg',
    'rut': 'Ruth',
    '1sa': '1Sam',
    '2sa': '2Sam',
    '1ki': '1Kgs',
    '2ki': '2Kgs',
    '1ch': '1Chr',
    '2ch': '2Chr',
    'ezr': 'Ezra',
    'neh': 'Neh',
    'est': 'Esth',
    'job': 'Job',
    'psa': 'Ps',
    'pro': 'Prov',
    'ecc': 'Eccl',
    'sol': 'Song',
    'isa': 'Isa',
    'jer': 'Jer',
    'lam': 'Lam',
    'eze': 'Ezek',
    'dan': 'Dan',
    'hos': 'Hos',
    'joe': 'Joel',
    'amo': 'Amos',
    'oba': 'Obad',
    'jon': 'Jonah',
    'mic': 'Mic',
    'nah': 'Nah',
    'hab': 'Hab',
    'zep': 'Zeph',
    'hag': 'Hag',
    'zec': 'Zech',
    'mal': 'Mal',
    'mat': 'Matt',
    'mrk': 'Mark',
    'luk': 'Luke',
    'jhn': 'John',
    'act': 'Acts',
    'rom': 'Rom',
    '1co': '1Cor',
    '2co': '2Cor',
    'gal': 'Gal',
    'eph': 'Eph',
    'phi': 'Phil',
    'col': 'Col',
    '1th': '1Thess',
    '2th': '2Thess',
    '1ti': '1Tim',
    '2ti': '2Tim',
    'tit': 'Titus',
    'phm': 'Phlm',
    'heb': 'Heb',
    'jam': 'Jas',
    '1pe': '1Pet',
    '2pe': '2Pet',
    '1jo': '1John',
    '2jo': '2John',
    '3jo': '3John',
    'jud': 'Jude',
    'rev': 'Rev'
};

let cachedHeadersData: any = null;

async function fetchHeadersData(): Promise<any> {
    if (cachedHeadersData) return cachedHeadersData;
    try {
        const res = await fetchWithCache<any>('/data/headers.json');
        if (res && res.data && Array.isArray(res.data) && Array.isArray(res.data[0])) {
            cachedHeadersData = res.data[0];
            return cachedHeadersData;
        }
    } catch (e) {
        console.warn('Could not load headers.json:', e);
    }
    return null;
}

async function injectHeadersIntoLocalBook(localBook: LocalBook, bookCode: string): Promise<LocalBook> {
    if (!localBook || !localBook.capitulo) return localBook;

    const osisCode = OSIS_MAPPING[bookCode.toLowerCase()];
    if (!osisCode) return localBook;

    const allHeaders = await fetchHeadersData();
    if (!allHeaders) return localBook;

    const bookHeaders = allHeaders.find((b: any) => b.osis === osisCode);
    if (!bookHeaders || !bookHeaders.chapters) return localBook;

    bookHeaders.chapters.forEach((ch: any) => {
        const chapterNumStr = ch.chapter?.toString();
        if (chapterNumStr && localBook.capitulo[chapterNumStr] && Array.isArray(ch.content)) {
            ch.content.forEach((item: any) => {
                const verseNumStr = item.verse?.toString();
                if (verseNumStr && localBook.capitulo[chapterNumStr][verseNumStr] && item.text) {
                    const verseObj = localBook.capitulo[chapterNumStr][verseNumStr];
                    if (!verseObj.titulos) {
                        verseObj.titulos = [];
                    }
                    if (!verseObj.titulos.includes(item.text)) {
                        verseObj.titulos.push(item.text);
                    }
                }
            });
        }
    });

    return localBook;
}

function getNrvaBookCode(localCode: string): string {
    const code = localCode.toLowerCase();
    return BOOK_MAPPING[code] || code.toUpperCase();
}

/**
 * Transforma la estructura de NRVA a la estructura local esperada por la app.
 */
function transformNrvaToLocal(data: NrvaBook): LocalBook {
    if (!data || !data.chapters) return null as any;

    const localChapters: { [chapter: string]: LocalChapter } = {};

    data.chapters.forEach(ch => {
        const chapterNum = ch.chapter.toString();
        const localChapter: LocalChapter = {};

        if (ch.verses && Array.isArray(ch.verses)) {
            ch.verses.forEach(v => {
                const verseNum = v.verse.toString();
                localChapter[verseNum] = {
                    texto: v.text,
                    text: v.text
                };
            });
        }

        localChapters[chapterNum] = localChapter;
    });

    return {
        nombre: data.name,
        categoria: '',
        capitulo: localChapters
    };
}

/**
 * Obtiene los datos de un libro de la Biblia NRVA directamente desde GitHub Raw CDN (con caché local).
 * Inyecta los títulos de sección desde headers.json.
 */
export async function fetchBibleBook(bookCode: string): Promise<LocalBook> {
    const nrvaCode = getNrvaBookCode(bookCode);
    const url = `${NRVA_RAW_BASE_URL}/${nrvaCode}.json`;

    try {
        const nrvaData = await fetchWithCache<NrvaBook>(url);

        if (!nrvaData) {
            throw new Error(`No data found for book ${bookCode} (NRVA: ${nrvaCode})`);
        }

        const localBook = transformNrvaToLocal(nrvaData);
        return await injectHeadersIntoLocalBook(localBook, bookCode);
    } catch (error) {
        console.error(`Error fetching book ${bookCode} from NRVA GitHub Raw:`, error);
        throw error;
    }
}
