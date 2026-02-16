import { useState, useEffect } from 'preact/hooks';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useStreak } from '../hooks/useStreak';
import { fetchWithCache } from '../../../utils/fetchWithCache';
import { BookOpen, MessageSquare } from 'lucide-preact';
import CommentaryModal from './CommentaryModal';

export default function HomeView() {
    const { dailyVerse, loading, error } = useDailyVerse();
    const progress = useStreak();
    const [commentary, setCommentary] = useState<any>(null);
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [showCommentary, setShowCommentary] = useState(false);

    // Load commentary when daily verse is available
    useEffect(() => {
        if (dailyVerse && showCommentary && !commentary) {
            loadCommentary();
        }
    }, [dailyVerse, showCommentary]);

    const loadCommentary = async () => {
        if (!dailyVerse) return;

        setCommentaryLoading(true);
        try {
            // Fetch the full commentary book data
            // Note: This matches the pattern in useCommentaryData
            const data = await fetchWithCache<any>(`/data/commentary/${dailyVerse.bookCode}.json`);

            if (data && data.chapters) {
                const chapterNum = parseInt(dailyVerse.chapter);
                const chapterData = data.chapters.find((c: any) => c.chapter === chapterNum);

                if (chapterData && chapterData.verses) {
                    // Find commentary for specific verse
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
            setCommentaryLoading(false);
        }
    };

    const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
        <div class="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
            {/* Header Section with Streak */}
            <header class="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-theme-text/10">
                <div class="text-center md:text-left space-y-2">
                    <h1 class="text-3xl md:text-4xl font-bold text-[var(--color-link)] font-dyslexic">
                        Lectura Accesible
                    </h1>
                    <p class="text-lg opacity-80 italic">
                        Tu compañero diario para el estudio bíblico
                    </p>
                </div>

                {/* Weekly Streak View */}
                <div class="bg-theme-text/5 rounded-2xl p-4 flex flex-col items-center min-w-[280px]">
                    <div class="flex items-center gap-2 mb-3 text-[var(--color-link)]">
                        <span class="text-2xl">🔥</span>
                        <span class="font-bold text-xl">
                            {progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'} racha
                        </span>
                    </div>

                    <div class="flex gap-2 justify-center w-full">
                        {progress.daysVisited.map((visited, index) => {
                            // Check if this day is part of the current streak relative to today
                            // Logic: If visited is true, it's marked.
                            // Current day is progress.todayIndex
                            const isToday = index === progress.todayIndex;
                            const isFuture = index > progress.todayIndex;

                            return (
                                <div key={index} class="flex flex-col items-center gap-1">
                                    <span class="text-xs opacity-60 font-bold">{daysOfWeek[index]}</span>
                                    <div
                                        class={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                            ${isFuture
                                                ? 'border-transparent bg-theme-text/5 opacity-30'
                                                : visited
                                                    ? 'bg-[var(--color-link)] border-[var(--color-link)] text-white shadow-sm scale-110'
                                                    : 'border-theme-text/20 bg-transparent opacity-50'
                                            }
                                            ${isToday ? 'ring-2 ring-offset-2 ring-[var(--color-link)] ring-offset-[var(--color-bg)]' : ''}
                                        `}
                                    >
                                        {visited && (
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Daily Verse Section - Pan de Vida */}
            <section class="bg-theme-text/5 rounded-3xl p-6 md:p-10 shadow-sm border border-theme-text/5 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 pointer-events-none">
                    <BookOpen size={120} />
                </div>

                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="bg-[var(--color-link)] text-white p-2 rounded-lg shadow-sm">
                            <span class="text-2xl">🍞</span>
                        </div>
                        <h2 class="text-2xl md:text-3xl font-bold text-[var(--color-link)]">
                            Pan de Vida
                        </h2>
                    </div>

                    {loading ? (
                        <div class="animate-pulse space-y-6">
                            <div class="h-4 bg-theme-text/10 rounded w-3/4"></div>
                            <div class="h-4 bg-theme-text/10 rounded w-full"></div>
                            <div class="h-4 bg-theme-text/10 rounded w-5/6"></div>
                            <div class="flex justify-end pt-4">
                                <div class="h-8 bg-theme-text/10 rounded w-32"></div>
                            </div>
                        </div>
                    ) : error ? (
                        <div class="text-red-500 text-center py-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                            <p class="font-bold">{error}</p>
                            <button onClick={() => window.location.reload()} class="mt-4 underline text-sm">Intentar de nuevo</button>
                        </div>
                    ) : dailyVerse ? (
                        <div class="space-y-8">
                            <div class="relative">
                                <span class="absolute -left-4 -top-4 text-6xl text-[var(--color-link)] opacity-20 font-serif">"</span>
                                <blockquote class="text-xl md:text-3xl font-serif leading-relaxed text-[var(--color-text)] text-center px-4 md:px-8 italic">
                                    {dailyVerse.text}
                                </blockquote>
                                <span class="absolute -right-4 -bottom-4 text-6xl text-[var(--color-link)] opacity-20 font-serif rotate-180">"</span>
                            </div>

                            <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-theme-text/10">
                                <div class="font-bold text-xl text-[var(--color-link)] bg-theme-text/5 px-4 py-2 rounded-lg">
                                    {dailyVerse.bookName} {dailyVerse.chapter}:{dailyVerse.verse}
                                </div>

                                <div class="flex gap-3">
                                    <button
                                        onClick={() => setShowCommentary(true)}
                                        class="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-text/10 hover:bg-theme-text/20 text-[var(--color-text)] rounded-xl transition-all font-bold"
                                    >
                                        <MessageSquare size={18} />
                                        Ver Comentario
                                    </button>

                                    <a
                                        href={`/?book=${dailyVerse.bookCode}&chapter=${dailyVerse.chapter}&verse=${dailyVerse.verse}`}
                                        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-link)] hover:opacity-90 !text-[var(--color-bg)] rounded-xl transition-all font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 !no-underline"
                                    >
                                        <BookOpen size={18} />
                                        Leer Capítulo
                                    </a>
                                </div>
                            </div>

                            {/* Commentary Modal */}
                            <CommentaryModal
                                isOpen={showCommentary}
                                onClose={() => setShowCommentary(false)}
                                commentary={commentary}
                                loading={commentaryLoading}
                                dailyVerse={dailyVerse}
                            />
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
