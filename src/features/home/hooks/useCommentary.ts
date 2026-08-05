import { useState, useEffect } from 'preact/hooks';
import { fetchWithCache } from '../../../utils/fetchWithCache';
import { getCommentaryBookCode } from '../../../utils/commentaryMapping';

export function useCommentary(dailyVerse: any) {
    const [commentary, setCommentary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showCommentary, setShowCommentary] = useState(false);

    useEffect(() => {
        if (dailyVerse && showCommentary && !commentary) {
            loadCommentary();
        }
    }, [dailyVerse, showCommentary]);

    const loadCommentary = async () => {
        if (!dailyVerse) return;

        setLoading(true);
        try {
            const commentaryCode = getCommentaryBookCode(dailyVerse.bookCode);
            const data = await fetchWithCache<any>(`/data/commentary/${commentaryCode}.json`);

            if (data && data.chapters) {
                const chapterNum = parseInt(dailyVerse.chapter);
                const chapterData = data.chapters.find((c: any) => c.chapter === chapterNum);

                if (chapterData && chapterData.verses) {
                    const verseNum = parseInt(dailyVerse.verse);
                    const verseCommentary = chapterData.verses.find((v: any) => v.verse === verseNum);

                    if (verseCommentary) {
                        setCommentary(verseCommentary);
                    }
                }
            }
        } catch (err) {
            console.error("Error loading commentary:", err);
        } finally {
            setLoading(false);
        }
    };

    return {
        commentary,
        loading,
        showCommentary,
        setShowCommentary
    };
}
