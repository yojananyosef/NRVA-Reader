import { useState, useEffect } from 'preact/hooks';

const STREAK_KEY = 'user-streak';

// Helper to get date string in local timezone (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to calculate best streak from history
const calculateBestStreak = (history: string[]): number => {
    if (!history || history.length === 0) return 0;

    // Sort dates
    const sortedDates = [...history].sort();

    let maxStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);

        // Calculate difference in days
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentRun++;
        } else if (diffDays > 1) {
            // Gap found, reset run
            currentRun = 1;
        }
        // If diffDays === 0 (same day), do nothing (keep current run)

        if (currentRun > maxStreak) {
            maxStreak = currentRun;
        }
    }

    return maxStreak;
};

interface StreakData {
    currentStreak: number;
    lastVisit: string;
    visitHistory: string[]; // Keep track of dates visited
    yearlyVisits: Record<string, number>; // Track visits per year
    bestStreak?: number; // Highest streak ever achieved
}

export interface WeeklyProgress {
    currentStreak: number;
    daysVisited: boolean[]; // Sunday to Saturday (0-6)
    todayIndex: number;
    totalDaysThisYear: number;
    weeksStreak: number;
    bestStreak: number;
}

export function useStreak() {
    const [progress, setProgress] = useState<WeeklyProgress>({
        currentStreak: 0,
        daysVisited: [false, false, false, false, false, false, false],
        todayIndex: 0,
        totalDaysThisYear: 0,
        weeksStreak: 0,
        bestStreak: 0
    });

    useEffect(() => {
        updateStreak();
    }, []);

    const updateStreak = () => {
        try {
            const now = new Date();
            const today = getLocalDateString(now);
            const currentYear = now.getFullYear().toString();
            const stored = localStorage.getItem(STREAK_KEY);
            let data: StreakData = stored ? JSON.parse(stored) : {
                currentStreak: 0,
                lastVisit: '',
                visitHistory: [],
                yearlyVisits: {},
                bestStreak: 0
            };

            // Ensure visitHistory exists for legacy data
            if (!data.visitHistory) {
                data.visitHistory = data.lastVisit ? [data.lastVisit] : [];
            }

            // Initialize yearlyVisits if missing
            if (!data.yearlyVisits) {
                data.yearlyVisits = {};
                // Recover count from history for current year if possible
                if (data.visitHistory) {
                    const thisYearVisits = data.visitHistory.filter(date => date.startsWith(currentYear)).length;
                    data.yearlyVisits[currentYear] = thisYearVisits;
                }
            }

            // Recalculate bestStreak from history if missing or possibly outdated
            // This ensures we catch historical streaks that weren't tracked before
            const calculatedBest = calculateBestStreak(data.visitHistory);
            if (data.bestStreak === undefined || calculatedBest > data.bestStreak) {
                data.bestStreak = calculatedBest;
            }

            // Update streak logic
            if (data.lastVisit !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = getLocalDateString(yesterday);

                if (data.lastVisit === yesterdayStr) {
                    data.currentStreak += 1;
                } else if (data.lastVisit !== today) {
                    // Reset streak if not visited yesterday (and not visited today yet)
                    // But if it's the first visit ever, streak is 1
                    data.currentStreak = 1;
                }

                // Update best streak
                if (data.currentStreak > (data.bestStreak || 0)) {
                    data.bestStreak = data.currentStreak;
                }

                data.lastVisit = today;
                if (!data.visitHistory.includes(today)) {
                    data.visitHistory.push(today);
                    // Increment yearly visits
                    data.yearlyVisits[currentYear] = (data.yearlyVisits[currentYear] || 0) + 1;
                }

                // Cleanup old history (keep last 60 days to ensure we have enough context)
                if (data.visitHistory.length > 60) {
                    data.visitHistory = data.visitHistory.slice(-60);
                }

                // Final check: maybe the new streak is the best ever
                if (data.currentStreak > data.bestStreak) {
                    data.bestStreak = data.currentStreak;
                }

                localStorage.setItem(STREAK_KEY, JSON.stringify(data));
            } else {
                // Even if already visited today, check if currentStreak > bestStreak just in case (e.g. migration)
                if (data.currentStreak > (data.bestStreak || 0)) {
                    data.bestStreak = data.currentStreak;
                    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
                }
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
                const dayStr = getLocalDateString(day);

                // A day is visited if it's in history
                // OR if it's today (we just updated/verified it)
                if (data.visitHistory.includes(dayStr)) {
                    daysVisited[i] = true;
                }
            }

            // Calculate weeks streak (rough estimate based on days / 7)
            const weeksStreak = Math.floor(data.currentStreak / 7);

            setProgress({
                currentStreak: data.currentStreak,
                daysVisited,
                todayIndex: currentDayIndex,
                totalDaysThisYear: data.yearlyVisits[currentYear] || 1, // At least 1 (today)
                weeksStreak,
                bestStreak: data.bestStreak || data.currentStreak
            });
        } catch (error) {
            console.error('Error updating streak:', error);
            // Fallback
            setProgress({
                currentStreak: 1,
                daysVisited: [false, false, false, false, false, false, false],
                todayIndex: new Date().getDay(),
                totalDaysThisYear: 1,
                weeksStreak: 0,
                bestStreak: 1
            });
        }
    };

    return progress;
}
