import { useDailyVerse } from '../hooks/useDailyVerse';
import { useStreak } from '../hooks/useStreak';
import { useCommentary } from '../hooks/useCommentary';
import { BookOpen, MessageSquare } from 'lucide-preact';
import CommentaryModal from './CommentaryModal';
import HomeHeader from './HomeHeader';

export default function HomeView() {
    const { dailyVerse, loading, error } = useDailyVerse();
    const progress = useStreak();
    const { commentary, loading: commentaryLoading, showCommentary, setShowCommentary } = useCommentary(dailyVerse);

    return (
        <div class="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
            {/* Header Section with Streak */}
            <HomeHeader progress={progress} />

            {/* Daily Verse Section - Pan de Vida */}
            <section class="bg-[var(--surface-muted-bg)] rounded-3xl p-6 md:p-10 shadow-sm border border-[var(--surface-muted-border)] relative overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 pointer-events-none">
                    <BookOpen size={120} />
                </div>

                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="bg-[var(--color-link)] text-white p-2 rounded-lg shadow-sm flex items-center justify-center w-10 h-10">
                            <span class="text-2xl leading-none">🍞</span>
                        </div>
                        <h2 class="text-2xl md:text-3xl font-bold text-[var(--color-link)] !m-0 leading-none flex items-center">
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

                            <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-[var(--surface-muted-border)]">
                                <div class="font-bold text-xl text-[var(--color-link)] bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] px-4 py-2 rounded-lg">
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
