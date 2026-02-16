
import { fetchWithCache } from './fetchWithCache';
import type { BibleVerse } from '../domain/bible/BibleEntities';

// Tipos para la estructura de Firebase
interface FirebaseVerse {
    texto: string;
    notas?: string[];
    titulos?: string[];
}

interface FirebaseBook {
    nombre: string;
    categoria: string;
    capitulos: (FirebaseVerse[] | null)[];
    // Otros campos que puedan venir
    [key: string]: any;
}

// Tipos para la estructura local (usada por la app)
// Alineamos con el dominio, pero mantenemos compatibilidad con la estructura actual de datos
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
    // Preservar otros campos si es necesario
    [key: string]: any;
}

const FIREBASE_BASE_URL = 'https://api-adventista-default-rtdb.firebaseio.com/libros';

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
    'jud': 'JUDE'
};

function getFirebaseBookCode(localCode: string): string {
    const code = localCode.toLowerCase();
    return BOOK_MAPPING[code] || code.toUpperCase();
}

/**
 * Transforma la estructura de Firebase a la estructura local esperada por la app.
 */
function transformFirebaseToLocal(data: FirebaseBook): LocalBook {
    if (!data) return null as any;

    const localChapters: { [chapter: string]: LocalChapter } = {};

    if (data.capitulos && Array.isArray(data.capitulos)) {
        data.capitulos.forEach((chapter, index) => {
            // El índice 0 suele ser null en arrays basados en 1-index
            if (!chapter) return;

            const chapterNum = index.toString();
            const localChapter: LocalChapter = {};

            if (Array.isArray(chapter)) {
                chapter.forEach((verse, vIndex) => {
                    if (!verse) return;
                    // El índice 0 de versículos también puede ser null
                    const verseNum = vIndex.toString();

                    localChapter[verseNum] = {
                        texto: verse.texto,
                        text: verse.texto, // Mapping for domain compatibility
                        notas: verse.notas,
                        notes: verse.notas, // Mapping for domain compatibility
                        titulos: verse.titulos
                    };
                });
            }

            localChapters[chapterNum] = localChapter;
        });
    }

    return {
        ...data,
        capitulo: localChapters
    };
}

/**
 * Obtiene los datos de un libro de la Biblia, ya sea desde la caché o desde Firebase.
 * Transforma los datos de Firebase al formato local.
 */
export async function fetchBibleBook(bookCode: string): Promise<LocalBook> {
    const firebaseCode = getFirebaseBookCode(bookCode);
    const url = `${FIREBASE_BASE_URL}/${firebaseCode}.json`;

    try {
        const firebaseData = await fetchWithCache<FirebaseBook>(url);

        // Si no hay datos, lanzar error para que la UI lo maneje
        if (!firebaseData) {
            throw new Error(`No data found for book ${bookCode} (Firebase: ${firebaseCode})`);
        }

        return transformFirebaseToLocal(firebaseData);
    } catch (error) {
        console.error(`Error fetching book ${bookCode} from Firebase:`, error);
        throw error;
    }
}
