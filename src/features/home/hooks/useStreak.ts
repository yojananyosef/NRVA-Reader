import { useState, useEffect } from 'preact/hooks';

const STREAK_KEY = 'user-streak';

interface StreakData {
    currentStreak: number;
    lastVisit: string;
    visitHistory: string[]; // Keep track of dates visited
}

export interface WeeklyProgress {
    currentStreak: number;
    daysVisited: boolean[]; // Sunday to Saturday (0-6)
    todayIndex: number;
}

export function useStreak() {
    const [progress, setProgress] = useState<WeeklyProgress>({
        currentStreak: 0,
        daysVisited: [false, false, false, false, false, false, false],
        todayIndex: 0
    });

    useEffect(() => {
        updateStreak();
    }, []);

    const updateStreak = () => {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const stored = localStorage.getItem(STREAK_KEY);
            let data: StreakData = stored ? JSON.parse(stored) : { currentStreak: 0, lastVisit: '', visitHistory: [] };

            // Ensure visitHistory exists for legacy data
            if (!data.visitHistory) {
                data.visitHistory = data.lastVisit ? [data.lastVisit] : [];
            }

            // Update streak logic
            if (data.lastVisit !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (data.lastVisit === yesterdayStr) {
                    data.currentStreak += 1;
                } else if (data.lastVisit !== today) {
                    // Reset streak if not visited yesterday (and not visited today yet)
                    // But if it's the first visit ever, streak is 1
                    data.currentStreak = 1;
                }

                data.lastVisit = today;
                if (!data.visitHistory.includes(today)) {
                    data.visitHistory.push(today);
                }

                // Cleanup old history (keep last 30 days)
                if (data.visitHistory.length > 30) {
                    data.visitHistory = data.visitHistory.slice(-30);
                }

                localStorage.setItem(STREAK_KEY, JSON.stringify(data));
            }

            // Calculate weekly progress
            const currentDayIndex = now.getDay(); // 0 (Sunday) to 6 (Saturday)
            const daysVisited = [false, false, false, false, false, false, false];

            // Get dates for current week (Sunday to Saturday)
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - currentDayIndex);

            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dayStr = day.toISOString().split('T')[0];

                // A day is visited if it's in history
                // OR if it's today (we just updated/verified it)
                if (data.visitHistory.includes(dayStr)) {
                    daysVisited[i] = true;
                }
            }

            // Special logic requested by user:
            // "comenzar a marcar desde el dia, por ejemplo si mi primera racha es en miercoles desde alli y dejar los otros sin marcar"
            // This means we should visually indicate the streak within the week.
            // If the streak is 3 days, and today is Friday, then Wed, Thu, Fri should be marked.
            // If streak > 7, all active days in week are part of streak.

            // Actually, the user's request "comenzar a marcar desde el dia... si mi primera racha es en miercoles" 
            // implies showing the streak visual representation on the calendar.
            // With the `daysVisited` array we know exactly which days were visited.
            // The UI can decide how to render the "flame" or "check" based on this array.

            setProgress({
                currentStreak: data.currentStreak,
                daysVisited,
                todayIndex: currentDayIndex
            });

        } catch (e) {
            console.error('Error updating streak:', e);
            // Fallback
            setProgress({
                currentStreak: 1,
                daysVisited: [false, false, false, false, false, false, false],
                todayIndex: new Date().getDay()
            });
        }
    };

    return progress;
}
