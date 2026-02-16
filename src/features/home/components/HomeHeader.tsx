interface HomeHeaderProps {
    progress: {
        currentStreak: number;
        daysVisited: boolean[];
        todayIndex: number;
    };
}

export default function HomeHeader({ progress }: HomeHeaderProps) {
    const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
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
    );
}
