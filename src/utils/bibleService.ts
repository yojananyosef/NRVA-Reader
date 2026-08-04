
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
 */
export async function fetchBibleBook(bookCode: string): Promise<LocalBook> {
    const nrvaCode = getNrvaBookCode(bookCode);
    const url = `${NRVA_RAW_BASE_URL}/${nrvaCode}.json`;

    try {
        const nrvaData = await fetchWithCache<NrvaBook>(url);

        if (!nrvaData) {
            throw new Error(`No data found for book ${bookCode} (NRVA: ${nrvaCode})`);
        }

        return transformNrvaToLocal(nrvaData);
    } catch (error) {
        console.error(`Error fetching book ${bookCode} from NRVA GitHub Raw:`, error);
        throw error;
    }
}
