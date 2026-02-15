import { useState, useEffect, useMemo } from 'preact/hooks';
import { lastInterlinearPosition } from '../../../stores/navigation';
import { fetchWithCache } from '../../../utils/fetchWithCache';
import { fetchBibleBook } from '../../../utils/bibleService';
import { formatRedLetters } from '../../../utils/redLetterUtils';
import type { InterlinearData } from '../../../features/interlinear/types';
import booksIndex from '../../../data/books-index.json';

export interface InterlinearParams {
    book: string;
    chapter: string;
    verse: string;
}

/**
 * useInterlinearParams (Application Hook)
 * 
 * Responsabilidad Única: Gestionar los parámetros de URL y estado de navegación de Interlinear.
 */
export function useInterlinearParams() {
    const [params, setParams] = useState<InterlinearParams>(() => {
        if (typeof window === "undefined") return { book: "gen", chapter: "1", verse: "1" };
        const searchParams = new URLSearchParams(window.location.search);

        // Si no hay parámetros en la URL, intentar cargar de lastInterlinearPosition
        if (!searchParams.get("book")) {
            const stored = lastInterlinearPosition.get();
            if (stored.lastBook && stored.lastChapter) {
                return {
                    book: stored.lastBook,
                    chapter: stored.lastChapter,
                    verse: stored.lastVerse || "1"
                };
            }
        }

        return {
            book: searchParams.get("book") || "gen",
            chapter: searchParams.get("chapter") || "1",
            verse: searchParams.get("verse") || "1"
        };
    });

    useEffect(() => {
        const updateParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            const book = searchParams.get("book");
            const chapter = searchParams.get("chapter");
            const verse = searchParams.get("verse");

            if (book && chapter) {
                setParams({ book, chapter, verse: verse || "1" });
            }
        };

        window.addEventListener("popstate", updateParams);
        return () => window.removeEventListener("popstate", updateParams);
    }, []);

    // Persistir estado
    useEffect(() => {
        if (params.book && params.chapter) {
            lastInterlinearPosition.set({
                lastBook: params.book,
                lastChapter: params.chapter,
                lastVerse: params.verse
            });
        }
    }, [params]);

    const updateUrl = (newParams: Partial<InterlinearParams>) => {
        const merged = { ...params, ...newParams };
        const url = new URL(window.location.href);
        url.searchParams.set("book", merged.book);
        url.searchParams.set("chapter", merged.chapter);
        url.searchParams.set("verse", merged.verse);

        window.history.pushState({}, "", url);
        setParams(merged);
    };

    return { params, setParams, updateUrl };
}

/**
 * useInterlinearData (Application Hook)
 * 
 * Responsabilidad Única: Orquestar la carga de datos Interlineales y de la Biblia paralela.
 */
export function useInterlinearData(bookCode: string, chapter: string, verse: string) {
    const [interlinearData, setInterlinearData] = useState<InterlinearData | null>(null);
    const [bibleText, setBibleText] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Mapeo de códigos de libro (puede moverse a un util si es compartido)
    const bookMapping: Record<string, string> = {
        gen: "genesis", exo: "exodus", lev: "leviticus", num: "numbers", deu: "deuteronomy",
        jos: "joshua", jdg: "judges", rut: "ruth", "1sa": "1_samuel", "2sa": "2_samuel",
        "1ki": "1_kings", "2ki": "2_kings", "1ch": "1_chronicles", "2ch": "2_chronicles",
        ezr: "ezra", neh: "nehemiah", est: "esther", job: "job", psa: "psalms",
        pro: "proverbs", ecc: "ecclesiastes", sol: "song_of_songs", isa: "isaiah",
        jer: "jeremiah", lam: "lamentations", eze: "ezekiel", dan: "daniel",
        hos: "hosea", joe: "joel", amo: "amos", oba: "obadiah", jon: "jonah",
        mic: "micah", nah: "nahum", hab: "habakkuk", zep: "zephaniah", hag: "haggai",
        zec: "zechariah", mal: "malachi",
        mat: "matthew", mrk: "mark", luk: "luke", jhn: "john", act: "acts",
        rom: "romans", "1co": "1-corinthians", "2co": "2-corinthians", gal: "galatians",
        eph: "ephesians", phi: "philippians", col: "colossians", "1th": "1-thessalonians",
        "2th": "2-thessalonians", "1ti": "1-timothy", "2ti": "2-timothy", tit: "titus",
        phm: "philemon", heb: "hebrews", jam: "james", "1pe": "1-peter", "2pe": "2-peter",
        "1jo": "1-john", "2jo": "2-john", "3jo": "3-john", jud: "jude", rev: "revelation",
    };

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoading(true);
            setError(null);

            try {
                const mappedBook = bookMapping[bookCode];
                if (!mappedBook) throw new Error(`Book mapping not found for ${bookCode}`);

                const bookInfo = booksIndex.find(b => b.code === bookCode);
                const section = bookInfo?.section === 'at' ? 'hebrew' : 'greek';

                // Carga paralela de datos interlineales y texto bíblico
                const [interlinearRes, bibleRes] = await Promise.all([
                    fetchWithCache<InterlinearData>(`/data/bible/${section}/${mappedBook}.json`),
                    fetchBibleBook(bookCode)
                ]);

                if (isMounted) {
                    setInterlinearData(interlinearRes);
                    setBibleText(bibleRes);
                }
            } catch (err) {
                console.error("Error loading interlinear data:", err);
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error("Error loading data"));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (bookCode && chapter && verse) {
            loadData();
        }

        return () => { isMounted = false; };
    }, [bookCode, chapter, verse]);

    // Calcular el versículo de la Biblia en español
    const currentBibleVerse = useMemo(() => {
        if (!bibleText || !bibleText.capitulo) return null;

        const chapterData = bibleText.capitulo[chapter];
        if (!chapterData) return null;

        const verseData = chapterData[verse];
        if (!verseData) return null;

        return {
            ...verseData,
            text: formatRedLetters(verseData.texto, bookCode, parseInt(chapter), parseInt(verse))
        };
    }, [bibleText, chapter, verse, bookCode]);

    return {
        interlinearData,
        currentBibleVerse,
        loading,
        error
    };
}
